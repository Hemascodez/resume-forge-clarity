import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema with length limits to prevent abuse
const RequestSchema = z.object({
  jobDescription: z.object({
    title: z.string().max(200, "Job title too long"),
    company: z.string().max(200, "Company name too long"),
    skills: z.array(z.string().max(100)).max(50, "Too many skills"),
    requirements: z.array(z.string().max(500)).max(20, "Too many requirements"),
    responsibilities: z.array(z.string().max(500)).max(20, "Too many responsibilities"),
  }),
  resume: z.object({
    skills: z.array(z.string().max(100)).max(50, "Too many skills"),
    experience: z.array(z.object({
      title: z.string().max(200),
      company: z.string().max(200),
      bullets: z.array(z.string().max(500)).max(20),
    })).max(10, "Too many experience entries"),
  }),
  conversationHistory: z.array(z.object({
    role: z.string().max(20),
    content: z.string().max(5000),
  })).max(20, "Conversation history too long").optional().default([]),
  userAnswer: z.string().max(2000, "Answer too long").optional(),
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Parse and validate input
    const rawBody = await req.json();
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
      historyLength: conversationHistory.length 
    });

    // Build the system prompt for gap analysis and question generation
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

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
    ];

    // Add user's latest answer if provided
    if (userAnswer) {
      messages.push({ role: 'user', content: userAnswer });
    } else {
      // Initial request - ask AI to start the interrogation
      messages.push({ 
        role: 'user', 
        content: 'Please analyze the resume against the job description and ask your first clarifying question about any skill gaps you identify.' 
      });
    }

    console.log('Calling Lovable AI with', messages.length, 'messages');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI usage limit reached. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    console.log('AI response received:', aiResponse?.substring(0, 200));

    // Parse the JSON response from AI
    let parsedResponse;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || 
                        aiResponse.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
      parsedResponse = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback: treat the response as a plain question
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
