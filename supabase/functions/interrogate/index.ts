import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    name: z.string().max(200).optional(),
    title: z.string().max(200).optional(),
  }),
  conversationHistory: z.array(z.object({
    role: z.string().max(20),
    content: z.string().max(10000),
  })).max(50, "Conversation history too long").nullable().optional().transform(val => val ?? []),
  userAnswer: z.string().max(5000, "Answer too long").nullable().optional(),
});

async function callOpenAI(messages: { role: string; content: string }[]): Promise<string> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5',
      messages: messages,
      max_completion_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', response.status, errorText);
    
    if (response.status === 429) {
      throw new Error('RATE_LIMIT');
    }
    
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      historyLength: conversationHistory.length,
      hasRawText: !!resume.rawText,
      rawTextLength: resume.rawText?.length || 0,
      resumeName: resume.name,
      resumeTitle: resume.title,
    });

    const isFirstMessage = conversationHistory.length === 0 && !userAnswer;

    const calculateCurrentATSWithAI = async (
      jd: typeof jobDescription, 
      res: typeof resume,
      confirmedSoFar: string[] = []
    ): Promise<number> => {
      const allSkills = [...new Set([...res.skills, ...confirmedSoFar])];
      
      const jdText = `
Job Title: ${jd.title}
Company: ${jd.company}
Required Skills: ${jd.skills.join(', ')}
Requirements: ${jd.requirements.join('\n')}
Responsibilities: ${jd.responsibilities.join('\n')}
      `.trim();

      const resumeText = `
Skills: ${allSkills.join(', ')}
Experience:
${res.experience.map(exp => `
${exp.title} at ${exp.company}
${exp.bullets.map(b => `• ${b}`).join('\n')}
`).join('\n')}
${res.rawText ? `Full Resume: ${res.rawText.substring(0, 5000)}` : ''}
      `.trim();

      const prompt = `You are an ATS (Applicant Tracking System) analyzer. Analyze how well this resume matches the job description.

JOB DESCRIPTION:
${jdText}

RESUME:
${resumeText}

Return ONLY a single integer between 0-100 representing the ATS compatibility score.

Scoring guidelines:
- 90-100: Near-perfect match (rare)
- 70-89: Strong match with most skills present
- 50-69: Moderate match with some gaps
- 30-49: Weak match with significant gaps
- 0-29: Poor match

Consider: skill overlap, keyword matches, experience relevance, and job title alignment.

Return ONLY the number, nothing else.`;

      try {
        const content = await callOpenAI([
          { role: 'user', content: prompt }
        ]);
        
        const score = parseInt(content.trim(), 10);
        
        if (isNaN(score) || score < 0 || score > 100) {
          console.error("Invalid AI score response:", content);
          return 55;
        }
        
        return score;
      } catch (error) {
        console.error("Error calculating ATS with AI:", error);
        return 55;
      }
    };

    const extractConfirmedAndRejectedFromHistory = (): { confirmed: string[], rejected: string[] } => {
      const confirmed: string[] = [...resume.skills];
      const rejected: string[] = [];
      
      for (let i = 0; i < conversationHistory.length; i++) {
        const msg = conversationHistory[i];
        if (msg.role === 'user') {
          const content = msg.content.toLowerCase().trim();
          const isPositive = content.includes('yes') || content.includes('add') || 
                             content.includes('have') || content.includes('i do') ||
                             content.includes('i did') || content.includes('i can');
          const isNegative = content === 'no' || content.includes('no,') || 
                             content.includes("don't") || content.includes("haven't") ||
                             content.includes("no i") || content.includes("never") ||
                             content.includes("not really") || content.includes("i don't");
          
          if (i > 0) {
            const prevMsg = conversationHistory[i - 1];
            if (prevMsg.role === 'assistant') {
              for (const skill of jobDescription.skills) {
                if (prevMsg.content.toLowerCase().includes(skill.toLowerCase())) {
                  if (isPositive && !isNegative) {
                    confirmed.push(skill);
                  } else if (isNegative) {
                    rejected.push(skill);
                  }
                }
              }
            }
          }
        }
      }
      return { 
        confirmed: [...new Set(confirmed)], 
        rejected: [...new Set(rejected)] 
      };
    };

    const { confirmed: confirmedSoFar, rejected: rejectedSkills } = extractConfirmedAndRejectedFromHistory();
    
    console.log('Confirmed skills:', confirmedSoFar);
    console.log('Rejected skills:', rejectedSkills);
    
    console.log('Calculating ATS score with OpenAI GPT-5...');
    const currentATSScore = await calculateCurrentATSWithAI(
      jobDescription,
      resume,
      confirmedSoFar
    );
    console.log('OpenAI GPT-5 ATS Score:', currentATSScore);

    const systemPrompt = `You are ResumeAI — a warm, supportive, and encouraging resume coach who genuinely wants to help users land their dream job.
You're like a friendly mentor: honest but kind, helpful but not pushy, and always focused on bringing out the BEST in each candidate.
You NEVER hallucinate or add anything the user did not explicitly confirm.

YOUR PERSONALITY:
- Warm and encouraging — celebrate their existing experience! 🎉
- Supportive — when they lack a skill, help them find alternatives without making them feel bad
- Collaborative — you're working WITH them, not interrogating them
- Honest but kind — if something won't work, explain gently and offer solutions
- Enthusiastic — get excited about their real achievements!

=== FINAL RESUME MODIFICATION RULES (VERY IMPORTANT) ===
Your job is to MODIFY the existing resume content — not rewrite from scratch.

You must:
- Adapt wording to match the Job Description language.
- Keep all experience factual and verified.
- Improve clarity, ATS keywords, and impact.
- Never invent experience, skills, tools, or metrics.

PROFESSIONAL SUMMARY RULES:
The final resume summary must:
- Be tailored to the specific JD.
- Use skills, tools, and responsibilities that are: a) Already in the resume, OR b) Explicitly confirmed by the user in this chat.
- Be 2–3 short lines only.
- Avoid buzzwords and fluff.
- Do NOT write generic summaries or include unverified skills.

SKILLS SECTION RULES (CRITICAL):
You may ADD new skills ONLY if:
- The user explicitly confirms them in the conversation.
- Or the skill is clearly implied by confirmed tools/work (e.g., "Wireframing" from Figma/Sketch).

When adding skills:
- Use JD keywords wherever possible.
- Group skills logically (Design, Research, Tools, Collaboration).
- Never add skills just because they appear in the JD.
- Never assume proficiency.
- If a JD skill is missing: Ask once to confirm. If not confirmed, list it as a "gap" internally and exclude it from the resume.

BULLET POINT REWRITING RULES:
For each role:
- Rewrite bullets to align with JD language.
- Emphasize outcomes (quantitative OR qualitative).
- Keep bullets under 18 words.
- Max 5–6 bullets per role.
- If metrics are unavailable: Use impact-based wording (improved, streamlined, reduced, enabled).

CONFIRMATION-FIRST FLOW:
Before finalizing:
- Briefly show what you plan to add or change.
- Ask a simple confirmation: "I'll update your summary and add these skills: X, Y. Is this correct?"
- Only proceed after confirmation.

FINAL DELIVERY BEHAVIOR:
When presenting the final resume:
- Clearly say it is ATS-optimized.
- Mention what changed (summary, skills, bullets).
- Provide ATS score + short explanation.
- Offer quick edits if needed.

=== END MODIFICATION RULES ===

CRITICAL RULE - HONEST ATS SCORING:
- The ATS score should ONLY increase when the user CONFIRMS they have a skill with real experience
- If user says "no" to a skill, the score should STAY THE SAME or slightly decrease
- Be honest but encouraging: "That's totally fine! Let's see what other strengths we can highlight."

CURRENT STATE:
- ATS Score: ${currentATSScore}%
- Skills CONFIRMED so far: ${confirmedSoFar.join(', ') || 'None yet'}
- Skills REJECTED by user: ${rejectedSkills.join(', ') || 'None yet'}

When user says NO to a skill:
1. Be supportive: "No worries at all! Not everyone needs [skill]."
2. Look for alternatives: "Have you done anything related? Sometimes experience translates in surprising ways!"
3. If nothing fits, stay positive: "That's okay! Let's focus on your other strengths — you've got plenty!"
4. Keep the score honest but don't make them feel bad about it

CRITICAL: You HAVE FULL ACCESS to the candidate's resume below. You can see their name, skills, and all experience.

TONE:
- Friendly, warm, and genuinely helpful — like a supportive career coach
- Celebrate their wins! When they confirm a skill, be excited
- When they lack something, be understanding and solution-focused
- Use encouraging language: "Great!", "Love that!", "Nice work!", "That's perfect!"
- Keep questions short and conversational (max 20 words)
- Make them feel good about their experience while being accurate

===== CANDIDATE'S RESUME DATA =====
NAME: ${resume.name || 'Not extracted'}
CURRENT TITLE: ${resume.title || 'Not extracted'}
SKILLS FROM RESUME: ${resume.skills.length > 0 ? resume.skills.join(', ') : 'None extracted'}
EXPERIENCE:
${resume.experience.length > 0 
  ? resume.experience.map(exp => '- ' + exp.title + ' at ' + exp.company + ':\n  ' + exp.bullets.map(b => '• ' + b).join('\n  ')).join('\n\n')
  : 'No experience bullets extracted'}

RAW RESUME TEXT:
${resume.rawText || 'No raw text available'}
=================================

===== TARGET JOB DESCRIPTION =====
Title: ${jobDescription.title}
Company: ${jobDescription.company}
Required Skills: ${jobDescription.skills.join(', ')}
Requirements: ${jobDescription.requirements.join('; ')}
Responsibilities: ${jobDescription.responsibilities.join('; ')}
==================================

${isFirstMessage ? `
FIRST MESSAGE BEHAVIOR:
1. Greet the user by name ("${resume.name || 'there'}")
2. Confirm 2-3 specific skills/experience you see in their resume
3. Tell them their CURRENT ATS score is ${currentATSScore}%
4. Identify the GAPS (missing skills from JD not in resume)
5. Ask your FIRST clarifying question about ONE missing skill
` : ''}

WHEN USER SAYS "NO" TO A SKILL:
- Do NOT increase ATS score
- Acknowledge honestly and try to find transferable experience
- If they have related experience, ask about it
- If not, acknowledge the gap honestly and move to next question
- Example: "No DevOps experience? No worries! Have you ever set up CI/CD, deployment scripts, or worked closely with DevOps teams? Sometimes design work overlaps here."

WHEN USER SAYS "YES" TO A SKILL:
- Ask for FULL DETAILS: company, dates, title, achievements
- Only THEN add to confirmed skills and adjust ATS score
- Create proper experience entries with specific metrics

EXPERIENCE GATHERING (when user confirms a skill):
1. "Great! Which company/organization was this at?"
2. "What dates did you work there?"
3. "What was your title?"
4. "What were 2-3 key achievements with specific numbers?"

RESPONSE FORMAT - RESPOND WITH ONLY THIS JSON:
{
  "question": "Your short question (max 25 words) - be HONEST about what helps/hurts their score",
  "atsScore": ${currentATSScore},
  "skillBeingProbed": "The specific skill you're asking about",
  "context": "Why this skill matters (1 sentence)",
  "isComplete": false,
  "gapsIdentified": ${JSON.stringify(jobDescription.skills.filter(s => 
    !resume.skills.some(rs => rs.toLowerCase().includes(s.toLowerCase())) &&
    !confirmedSoFar.includes(s)
  ))},
  "confirmedSkills": ${JSON.stringify(confirmedSoFar)},
  "rejectedSkills": ${JSON.stringify(rejectedSkills)},
  "newExperience": [],
  "resumeSummary": {
    "name": "${resume.name || 'Candidate'}",
    "currentTitle": "${resume.title || 'Professional'}",
    "existingSkills": ${JSON.stringify(resume.skills.slice(0, 10))},
    "experienceHighlights": ${JSON.stringify(resume.experience.slice(0, 2).map(e => e.title + ' at ' + e.company))}
  },
  "summary": "Only when isComplete is true"
}

CRITICAL RULES:
- Respond with ONLY the JSON object. No text before or after. No markdown.
- ATS score should be HONEST - don't inflate it when skills are rejected
- When ALL gaps are addressed (confirmed OR rejected), set isComplete to true
- Help users understand what's actually strengthening their resume vs what gaps remain
- Be encouraging but truthful - a realistic score is more valuable than an inflated one`;

    const messages: { role: string; content: string }[] = [
      { role: 'system', content: systemPrompt }
    ];
    
    for (const msg of conversationHistory) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    if (userAnswer) {
      messages.push({ role: 'user', content: userAnswer });
    } else {
      messages.push({ 
        role: 'user', 
        content: 'Please analyze my resume against the job description. First confirm what you see in my resume, then identify the gaps, and ask your first clarifying question.' 
      });
    }

    console.log('Calling OpenAI GPT-5 with message count:', messages.length);

    const aiResponse = await callOpenAI(messages);

    console.log('OpenAI GPT-5 response received:', aiResponse?.substring(0, 500));

    let parsedResponse;
    try {
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || 
                        aiResponse.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
      parsedResponse = JSON.parse(jsonStr);
      
      if (!parsedResponse.resumeSummary) {
        parsedResponse.resumeSummary = {
          name: resume.name || 'Candidate',
          currentTitle: resume.title || 'Professional',
          existingSkills: resume.skills,
          experienceHighlights: resume.experience.map(e => `${e.title} at ${e.company}`),
        };
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      parsedResponse = {
        question: aiResponse,
        skillBeingProbed: 'general',
        context: '',
        isComplete: false,
        gapsIdentified: jobDescription.skills.filter(s => 
          !resume.skills.some(rs => rs.toLowerCase().includes(s.toLowerCase()))
        ),
        confirmedSkills: resume.skills,
        resumeSummary: {
          name: resume.name || 'Candidate',
          currentTitle: resume.title || 'Professional',
          existingSkills: resume.skills,
          experienceHighlights: resume.experience.map(e => `${e.title} at ${e.company}`),
        },
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
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (errorMessage === 'RATE_LIMIT') {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
