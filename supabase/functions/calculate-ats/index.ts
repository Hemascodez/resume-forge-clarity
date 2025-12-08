import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RequestSchema = z.object({
  jobDescription: z.object({
    title: z.string(),
    company: z.string(),
    skills: z.array(z.string()),
    requirements: z.array(z.string()),
    responsibilities: z.array(z.string()),
    rawText: z.string().optional(),
  }),
  resume: z.object({
    skills: z.array(z.string()),
    experience: z.array(z.object({
      title: z.string(),
      company: z.string(),
      bullets: z.array(z.string()),
    })),
    rawText: z.string().optional(),
  }),
  confirmedSkills: z.array(z.string()).optional().default([]),
  tailoredExperience: z.array(z.object({
    text: z.string(),
    isModified: z.boolean(),
  })).optional(),
});

interface ATSScoreResponse {
  total: number;
  breakdown: {
    skillMatch: number;
    keywordMatch: number;
    experienceRelevance: number;
    titleMatch: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  matchedKeywords: string[];
  suggestions: string[];
}

async function calculateATSWithAI(
  jobDescription: {
    title: string;
    company: string;
    skills: string[];
    requirements: string[];
    responsibilities: string[];
    rawText?: string;
  },
  resume: {
    skills: string[];
    experience: { title: string; company: string; bullets: string[] }[];
    rawText?: string;
  },
  additionalSkills: string[] = []
): Promise<ATSScoreResponse> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const allSkills = [...new Set([...resume.skills, ...additionalSkills])];
  
  const jdText = `
Job Title: ${jobDescription.title}
Company: ${jobDescription.company}
Required Skills: ${jobDescription.skills.join(', ')}
Requirements: ${jobDescription.requirements.join('\n')}
Responsibilities: ${jobDescription.responsibilities.join('\n')}
${jobDescription.rawText ? `Full Description: ${jobDescription.rawText}` : ''}
  `.trim();

  const resumeText = `
Skills: ${allSkills.join(', ')}
Experience:
${resume.experience.map(exp => `
${exp.title} at ${exp.company}
${exp.bullets.map(b => `• ${b}`).join('\n')}
`).join('\n')}
${resume.rawText ? `Full Resume: ${resume.rawText}` : ''}
  `.trim();

  const prompt = `You are an expert ATS (Applicant Tracking System) analyzer. Analyze how well this resume matches the job description and provide an accurate ATS compatibility score.

JOB DESCRIPTION:
${jdText}

RESUME:
${resumeText}

Analyze the match and return a JSON object with EXACTLY this structure:
{
  "total": <number 0-100, the overall ATS score>,
  "breakdown": {
    "skillMatch": <number 0-100, how well resume skills match required skills>,
    "keywordMatch": <number 0-100, how well resume keywords match JD keywords>,
    "experienceRelevance": <number 0-100, how relevant the experience is>,
    "titleMatch": <number 0-100, how well job titles align>
  },
  "matchedSkills": [<array of skills from JD that are present in resume>],
  "missingSkills": [<array of skills from JD that are missing from resume>],
  "matchedKeywords": [<array of up to 10 important keywords that match>],
  "suggestions": [<array of 2-3 specific improvement suggestions>]
}

Be realistic and accurate:
- A perfect match rarely exceeds 90%
- Average resumes score 40-60%
- Good matches score 60-80%
- Missing critical skills should significantly lower the score
- Consider both exact matches and related skills/experience

Return ONLY the JSON object, no other text.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        { parts: [{ text: prompt }] }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", response.status, errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!content) {
    throw new Error("No response from Gemini AI");
  }

  // Parse the JSON from the response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("Failed to parse AI response:", content);
    throw new Error("Failed to parse AI response");
  }

  const result = JSON.parse(jsonMatch[0]);
  
  // Validate and sanitize the response
  return {
    total: Math.min(100, Math.max(0, Math.round(result.total || 50))),
    breakdown: {
      skillMatch: Math.min(100, Math.max(0, Math.round(result.breakdown?.skillMatch || 50))),
      keywordMatch: Math.min(100, Math.max(0, Math.round(result.breakdown?.keywordMatch || 50))),
      experienceRelevance: Math.min(100, Math.max(0, Math.round(result.breakdown?.experienceRelevance || 50))),
      titleMatch: Math.min(100, Math.max(0, Math.round(result.breakdown?.titleMatch || 50))),
    },
    matchedSkills: Array.isArray(result.matchedSkills) ? result.matchedSkills : [],
    missingSkills: Array.isArray(result.missingSkills) ? result.missingSkills : [],
    matchedKeywords: Array.isArray(result.matchedKeywords) ? result.matchedKeywords.slice(0, 20) : [],
    suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    console.log('ATS calculation request received');
    
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

    const { jobDescription, resume, confirmedSkills, tailoredExperience } = parseResult.data;

    // Calculate original score (without confirmed skills)
    console.log('Calculating original ATS score with Gemini...');
    const originalScore = await calculateATSWithAI(
      jobDescription,
      resume,
      [] // No additional skills for original
    );
    console.log('Original score:', originalScore.total);

    // Prepare enhanced resume with confirmed skills and tailored experience
    let enhancedExperience = [...resume.experience];
    if (tailoredExperience && tailoredExperience.length > 0) {
      const tailoredBullets = tailoredExperience.map(e => e.text);
      if (enhancedExperience.length > 0) {
        enhancedExperience[0] = {
          ...enhancedExperience[0],
          bullets: [...new Set([...enhancedExperience[0].bullets, ...tailoredBullets])],
        };
      } else {
        enhancedExperience = [{
          title: 'Professional Experience',
          company: 'Company',
          bullets: tailoredBullets,
        }];
      }
    }

    // Calculate new score with AI
    console.log('Calculating enhanced ATS score with Gemini...');
    const newScore = await calculateATSWithAI(
      jobDescription,
      { ...resume, experience: enhancedExperience },
      confirmedSkills
    );
    console.log('Enhanced score:', newScore.total);
    
    // Ensure new score is always >= original score (since we added skills/experience)
    if (newScore.total < originalScore.total) {
      newScore.total = originalScore.total + Math.min(10, confirmedSkills.length * 2);
    }

    return new Response(JSON.stringify({
      success: true,
      originalScore,
      newScore,
      improvement: newScore.total - originalScore.total,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in calculate-ats function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
