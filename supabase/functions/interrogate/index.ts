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
    name: z.string().max(200).optional(),
    title: z.string().max(200).optional(),
  }),
  conversationHistory: z.array(z.object({
    role: z.string().max(20),
    content: z.string().max(10000),
  })).max(50, "Conversation history too long").nullable().optional().transform(val => val ?? []),
  userAnswer: z.string().max(5000, "Answer too long").nullable().optional(),
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
      historyLength: conversationHistory.length,
      hasRawText: !!resume.rawText,
      rawTextLength: resume.rawText?.length || 0,
      resumeName: resume.name,
      resumeTitle: resume.title,
    });

    // Determine if this is the first message (no conversation history and no user answer)
    const isFirstMessage = conversationHistory.length === 0 && !userAnswer;

    // Unified ATS calculation - SAME algorithm as calculate-ats function
    const normalizeText = (text: string): string => {
      return text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
    };

    const calculateSimilarity = (str1: string, str2: string): number => {
      const words1 = new Set(normalizeText(str1).split(/\s+/).filter(w => w.length > 2));
      const words2 = new Set(normalizeText(str2).split(/\s+/).filter(w => w.length > 2));
      if (words1.size === 0 || words2.size === 0) return 0;
      let matches = 0;
      words1.forEach(word => { if (words2.has(word)) matches++; });
      return matches / Math.max(words1.size, words2.size);
    };

    const extractKeywords = (text: string): Set<string> => {
      const normalized = normalizeText(text);
      const words = normalized.split(/\s+/).filter(w => w.length > 2);
      const stopWords = new Set([
        'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
        'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'will', 'your',
        'from', 'they', 'this', 'that', 'with', 'would', 'there', 'their', 'what',
        'about', 'which', 'when', 'make', 'like', 'time', 'just', 'know', 'take',
        'people', 'into', 'year', 'good', 'some', 'could', 'them', 'see', 'other',
        'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
        'also', 'back', 'after', 'use', 'two', 'how', 'work', 'first', 'well',
        'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day',
        'most', 'experience', 'years', 'ability', 'strong', 'including', 'such',
        'must', 'etc', 'highly', 'preferred', 'required', 'minimum',
      ]);
      return new Set(words.filter(w => !stopWords.has(w)));
    };

    // Calculate ATS score using SAME weighted algorithm as calculate-ats
    const calculateCurrentATS = (
      jdSkills: string[], 
      jdRequirements: string[], 
      jdResponsibilities: string[],
      jdTitle: string,
      resumeSkills: string[], 
      resumeExperience: { title: string; company: string; bullets: string[] }[],
      confirmedSoFar: string[] = []
    ): number => {
      const allResumeSkills = [...new Set([...resumeSkills, ...confirmedSoFar])];
      
      // 1. Skill Match Score (40% weight)
      const normalizedJDSkills = jdSkills.map(s => normalizeText(s));
      const normalizedResumeSkills = allResumeSkills.map(s => normalizeText(s));
      
      let matchedCount = 0;
      normalizedJDSkills.forEach((jdSkill) => {
        const found = normalizedResumeSkills.some(resumeSkill => 
          resumeSkill.includes(jdSkill) || jdSkill.includes(resumeSkill) ||
          calculateSimilarity(jdSkill, resumeSkill) > 0.6
        );
        if (found) matchedCount++;
      });
      
      const skillMatchRatio = jdSkills.length > 0 ? matchedCount / jdSkills.length : 0.5;
      const skillMatchScore = 40 + (skillMatchRatio * 60); // Range: 40-100
      
      // 2. Keyword Match Score (30% weight)
      const jdText = [...jdRequirements, ...jdResponsibilities].join(' ');
      const jdKeywords = extractKeywords(jdText);
      
      const resumeText = resumeExperience.map(exp => 
        `${exp.title} ${exp.company} ${exp.bullets.join(' ')}`
      ).join(' ') + ' ' + allResumeSkills.join(' ');
      const resumeKeywords = extractKeywords(resumeText);
      
      let keywordMatches = 0;
      jdKeywords.forEach(keyword => {
        if (resumeKeywords.has(keyword)) keywordMatches++;
      });
      
      const keywordRatio = jdKeywords.size > 0 ? keywordMatches / jdKeywords.size : 0.5;
      const keywordMatchScore = 30 + (keywordRatio * 70); // Range: 30-100
      
      // 3. Experience Relevance Score (20% weight)
      let experienceScore = 50;
      if (resumeExperience.length > 0) {
        const expScores = resumeExperience.map(exp => {
          const expText = `${exp.title} ${exp.bullets.join(' ')}`;
          return calculateSimilarity(expText, jdText) * 100;
        });
        experienceScore = Math.max(50, ...expScores.map(s => 50 + s * 0.5));
      }
      
      // 4. Title Match Score (10% weight)
      const resumeTitles = resumeExperience.map(exp => normalizeText(exp.title));
      const normalizedJDTitle = normalizeText(jdTitle);
      const titleSimilarity = resumeTitles.reduce((best, title) => 
        Math.max(best, calculateSimilarity(title, normalizedJDTitle)), 0
      );
      const titleMatchScore = 40 + (titleSimilarity * 60); // Range: 40-100
      
      // Calculate weighted total - SAME formula as calculate-ats
      const rawTotal = Math.round(
        (skillMatchScore * 0.4) +
        (keywordMatchScore * 0.3) +
        (experienceScore * 0.2) +
        (titleMatchScore * 0.1)
      );
      
      // Minimum 45 for original scores
      return Math.min(100, Math.max(45, rawTotal));
    };

    // Extract confirmed skills from conversation history
    const extractConfirmedFromHistory = (): string[] => {
      const confirmed: string[] = [...resume.skills];
      for (const msg of conversationHistory) {
        if (msg.role === 'user') {
          const content = msg.content.toLowerCase();
          if (content.includes('yes') || content.includes('add') || content.includes('have')) {
            // Try to find skill mentions in the preceding assistant message
            const idx = conversationHistory.indexOf(msg);
            if (idx > 0) {
              const prevMsg = conversationHistory[idx - 1];
              if (prevMsg.role === 'assistant') {
                for (const skill of jobDescription.skills) {
                  if (prevMsg.content.toLowerCase().includes(skill.toLowerCase())) {
                    confirmed.push(skill);
                  }
                }
              }
            }
          }
        }
      }
      return [...new Set(confirmed)];
    };

    const confirmedSoFar = extractConfirmedFromHistory();
    const currentATSScore = calculateCurrentATS(
      jobDescription.skills, 
      jobDescription.requirements, 
      jobDescription.responsibilities,
      jobDescription.title,
      resume.skills, 
      resume.experience,
      confirmedSoFar
    );

    const systemPrompt = `You are ResumeAI — a fast, credibility-checking, funny-but-serious resume generator.
Your job is to verify the user's experience, catch exaggerations politely, and create a clean, ATS-friendly updated resume using ONLY confirmed facts.
You must never hallucinate or add anything the user did not explicitly confirm.

CRITICAL: You HAVE FULL ACCESS to the candidate's resume below. You can see their name, skills, and all experience. DO NOT ever say you cannot see their resume.

CURRENT ATS SCORE: ${currentATSScore}% (minimum is always 60%)
Include the current ATS score in your response to keep the user informed!

TONE:
- Fast, clear, friendly, slightly funny — but still serious enough for career use.
- If the user exaggerates something unrealistic, gently tease them ("Are you sure you built the entire product alone? 👀") and request credible clarification.
- Ask ONLY essential, short verification questions (max 20 words).
- NEVER waste the user's time with long explanations.
- ALWAYS mention the current ATS score in your question to show progress!

===== CANDIDATE'S RESUME DATA (THIS IS THEIR ACTUAL RESUME) =====
NAME: ${resume.name || 'Not extracted'}
CURRENT TITLE: ${resume.title || 'Not extracted'}
SKILLS FROM RESUME: ${resume.skills.length > 0 ? resume.skills.join(', ') : 'None extracted'}
EXPERIENCE:
${resume.experience.length > 0 
  ? resume.experience.map(exp => `- ${exp.title} at ${exp.company}:\n  ${exp.bullets.map(b => '• ' + b).join('\n  ')}`).join('\n\n')
  : 'No experience bullets extracted'}

RAW RESUME TEXT:
${resume.rawText || 'No raw text available'}
=================================================================

===== TARGET JOB DESCRIPTION =====
Title: ${jobDescription.title}
Company: ${jobDescription.company}
Required Skills: ${jobDescription.skills.join(', ')}
Requirements: ${jobDescription.requirements.join('; ')}
Responsibilities: ${jobDescription.responsibilities.join('; ')}
==================================

CRITICAL EXPERIENCE GATHERING WORKFLOW:
When a user confirms they have experience with a skill (e.g., "Yes, I have clinical research experience"), you MUST gather complete details to create a proper resume entry. Ask follow-up questions in this order:

1. COMPANY/ORGANIZATION: "Great! Which company/organization was this at?"
2. TIME PERIOD: "What dates did you work there? (e.g., Jan 2020 - Dec 2022)"
3. JOB TITLE: "What was your job title for this role?"
4. KEY ACHIEVEMENTS: "What were 2-3 key achievements or responsibilities? Be specific with numbers if possible."

Store this as a NEW EXPERIENCE ENTRY in the newExperience array - NOT as generic bullet points.

${isFirstMessage ? `
FIRST MESSAGE BEHAVIOR:
Since this is the FIRST message, you MUST:
1. Greet the user by name if available (use "${resume.name || 'there'}")
2. Confirm you have read their resume by mentioning 2-3 specific skills/experience you see
3. Tell them their CURRENT ATS score is ${currentATSScore}%
4. Identify the GAP between their resume and the JD (list specific missing skills)
5. Ask your FIRST clarifying question about ONE missing skill

Example first message format:
{
  "question": "Hey [Name]! I see you have React and TypeScript experience at [Company]. Nice! Your current ATS score is ${currentATSScore}%. For this [JD Title] role, I noticed [Missing Skill] is required but not on your resume. Have you worked with it?",
  "atsScore": ${currentATSScore},
  "skillBeingProbed": "the missing skill",
  "context": "Required by JD",
  "isComplete": false,
  "gapsIdentified": ["list", "of", "missing", "skills"],
  "confirmedSkills": ["skills", "already", "on", "resume"],
  "resumeSummary": {
    "name": "${resume.name || 'Candidate'}",
    "currentTitle": "${resume.title || 'Professional'}",
    "existingSkills": ${JSON.stringify(resume.skills.slice(0, 10))},
    "experienceHighlights": ${JSON.stringify(resume.experience.slice(0, 2).map(e => e.title + ' at ' + e.company))}
  }
}
` : ''}

RULES FOR QUESTIONING:
1) When user confirms a skill, ask for FULL DETAILS: company, dates, title, achievements.
2) Create proper experience entries with title, company, dates, and bullet points.
3) Use concise bullets (max 18 words each). Max 4 bullets per role.
4) Ask short, single-purpose questions. One question at a time.
5) Stop questioning once all gaps are verified with complete experience details.
6) ALWAYS include the current ATS score (${currentATSScore}%) in your question to show progress!

RESPONSE FORMAT - YOU MUST RESPOND WITH ONLY THIS JSON STRUCTURE:
{
  "question": "Your short clarifying question mentioning ATS score (max 25 words)",
  "atsScore": ${currentATSScore},
  "skillBeingProbed": "The specific skill you're asking about",
  "context": "Why this skill matters (1 sentence max)",
  "isComplete": false,
  "gapsIdentified": ["skill", "gaps", "found"],
  "confirmedSkills": ["confirmed", "skills", "from", "resume"],
  "newExperience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "date": "Jan 2020 - Dec 2022",
      "bullets": ["Achievement 1 with specific metrics", "Achievement 2"]
    }
  ],
  "resumeSummary": {
    "name": "Candidate name from resume",
    "currentTitle": "Their current/latest title",
    "existingSkills": ["skills", "from", "their", "resume"],
    "experienceHighlights": ["key", "experience", "items"]
  },
  "summary": "Only when isComplete is true - brief summary of verified skills"
}

CRITICAL: 
- Respond with ONLY the JSON object above. No text before or after. No markdown code blocks.
- ALWAYS include atsScore field with the current score (${currentATSScore}).
- When user provides experience details, add them to newExperience array with proper structure.
- newExperience entries should look professional: title, company, date range, and 2-4 bullet points.
- confirmedSkills should include skills that ARE on their resume AND any new ones user confirms.
- gapsIdentified should be skills from JD that are NOT on their resume.
- When all gaps are addressed with complete experience details, set isComplete to true and provide summary.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
    ];

    if (userAnswer) {
      messages.push({ role: 'user', content: userAnswer });
    } else {
      messages.push({ 
        role: 'user', 
        content: 'Please analyze my resume against the job description. First confirm what you see in my resume, then identify the gaps, and ask your first clarifying question.' 
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
        max_tokens: 1500,
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

    console.log('OpenAI response received:', aiResponse?.substring(0, 500));

    let parsedResponse;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || 
                        aiResponse.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
      parsedResponse = JSON.parse(jsonStr);
      
      // Ensure resumeSummary is populated
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
      // Create a structured response from the raw text
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
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
