import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema with generous limits
const RequestSchema = z.object({
  jobDescription: z.object({
    title: z.string().max(500, "Job title too long"),
    company: z.string().max(500, "Company name too long"),
    skills: z.array(z.string().max(200)).max(50, "Too many skills"),
    requirements: z.array(z.string().max(1000)).max(30, "Too many requirements"),
    responsibilities: z.array(z.string().max(1000)).max(30, "Too many responsibilities"),
    rawText: z.string().max(50000).optional(),
  }),
  resume: z.object({
    skills: z.array(z.string().max(200)).max(100, "Too many skills"),
    experience: z.array(z.object({
      title: z.string().max(500),
      company: z.string().max(500),
      bullets: z.array(z.string().max(1000)).max(30),
    })).max(20, "Too many experience entries"),
    rawText: z.string().max(100000).optional(),
  }),
  conversationHistory: z.array(z.object({
    role: z.string().max(20),
    content: z.string().max(10000),
  })).max(50, "Conversation history too long").optional().default([]),
  userAnswer: z.string().max(5000, "Answer too long").optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const rawBody = await req.json();
    console.log('Received request body keys:', Object.keys(rawBody));
    
    const parseResult = RequestSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      console.error('Validation failed:', parseResult.error.flatten());
      return new Response(JSON.stringify({ 
        error: 'Invalid request data', 
        details: parseResult.error.flatten().fieldErrors 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { jobDescription, resume, conversationHistory, userAnswer } = parseResult.data;

    console.log('Interrogate request received:', { 
      jdTitle: jobDescription.title, 
      resumeSkillsCount: resume.skills.length,
      experienceCount: resume.experience.length,
      historyLength: conversationHistory.length 
    });

    const systemPrompt = `You are an expert AI recruiter conducting a friendly but thorough interview to help tailor a resume to a job description. Your goal is to uncover hidden skills and experiences that the candidate may have but didn't list on their resume.

CRITICAL RULES:
1. NEVER invent or assume skills the candidate hasn't confirmed
2. Ask ONE clarifying question at a time
3. Be conversational and encouraging, not interrogative
4. Focus on gaps between the JD requirements and the resume
5. When the candidate confirms a skill, acknowledge it positively
6. When they deny having a skill, move on gracefully to the next gap
7. After 3-5 questions or when all major gaps are addressed, indicate completion

JOB DESCRIPTION:
- Title: ${jobDescription.title}
- Company: ${jobDescription.company}
- Required Skills: ${jobDescription.skills.join(', ')}
- Requirements: ${jobDescription.requirements.join('; ')}
- Responsibilities: ${jobDescription.responsibilities.join('; ')}

CANDIDATE'S RESUME:
- Listed Skills: ${resume.skills.join(', ')}
- Experience: ${resume.experience.map(exp => `${exp.title} at ${exp.company}: ${exp.bullets.join('; ')}`).join(' | ')}

RESPONSE FORMAT:
Respond with a JSON object containing:
{
  "question": "Your clarifying question here",
  "skillBeingProbed": "The specific skill or requirement you're asking about",
  "context": "Brief explanation of why this skill matters for the role",
  "isComplete": false,
  "gapsIdentified": ["list", "of", "skill", "gaps"],
  "confirmedSkills": ["skills", "candidate", "confirmed"],
  "summary": "Only include when isComplete is true - summary of findings"
}

If the conversation is complete (all gaps addressed or 5+ questions asked), set isComplete to true and provide a summary.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
    ];

    if (userAnswer) {
      messages.push({ role: 'user', content: userAnswer });
    } else {
      messages.push({ 
        role: 'user', 
        content: 'Please analyze the resume against the job description and ask your first clarifying question about any skill gaps you identify.' 
      });
    }

    console.log('Calling OpenAI GPT-4o-mini with', messages.length, 'messages');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    console.log('OpenAI response received:', aiResponse?.substring(0, 200));

    let parsedResponse;
    try {
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || 
                        aiResponse.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
      parsedResponse = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      parsedResponse = {
        question: aiResponse,
        skillBeingProbed: 'general',
        context: '',
        isComplete: false,
        gapsIdentified: [],
        confirmedSkills: [],
      };
    }

    return new Response(JSON.stringify({
      success: true,
      ...parsedResponse,
      rawResponse: aiResponse,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in interrogate function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
