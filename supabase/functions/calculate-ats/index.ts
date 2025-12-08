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

// Normalize text for comparison
function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
}

// Calculate similarity between two strings
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(normalizeText(str1).split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(normalizeText(str2).split(/\s+/).filter(w => w.length > 2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  let matches = 0;
  words1.forEach(word => {
    if (words2.has(word)) matches++;
  });
  
  return matches / Math.max(words1.size, words2.size);
}

// Extract keywords from text
function extractKeywords(text: string): Set<string> {
  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/).filter(w => w.length > 2);
  
  // Common stop words to filter out
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
    'must', 'etc', 'highly', 'etc', 'preferred', 'required', 'minimum',
  ]);
  
  return new Set(words.filter(w => !stopWords.has(w)));
}

interface ATSScore {
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

function calculateATSScore(
  jdSkills: string[],
  jdRequirements: string[],
  jdResponsibilities: string[],
  jdTitle: string,
  resumeSkills: string[],
  resumeExperience: { title: string; company: string; bullets: string[] }[],
  additionalSkills: string[] = []
): ATSScore {
  // Combine all resume skills
  const allResumeSkills = [...new Set([...resumeSkills, ...additionalSkills])];
  
  // 1. Skill Match Score (40% weight)
  const normalizedJDSkills = jdSkills.map(s => normalizeText(s));
  const normalizedResumeSkills = allResumeSkills.map(s => normalizeText(s));
  
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  
  normalizedJDSkills.forEach((jdSkill, idx) => {
    const found = normalizedResumeSkills.some(resumeSkill => 
      resumeSkill.includes(jdSkill) || jdSkill.includes(resumeSkill) ||
      calculateSimilarity(jdSkill, resumeSkill) > 0.7
    );
    if (found) {
      matchedSkills.push(jdSkills[idx]);
    } else {
      missingSkills.push(jdSkills[idx]);
    }
  });
  
  const skillMatchScore = jdSkills.length > 0 
    ? (matchedSkills.length / jdSkills.length) * 100 
    : 50;
  
  // 2. Keyword Match Score (30% weight)
  const jdText = [...jdRequirements, ...jdResponsibilities].join(' ');
  const jdKeywords = extractKeywords(jdText);
  
  const resumeText = resumeExperience.map(exp => 
    `${exp.title} ${exp.company} ${exp.bullets.join(' ')}`
  ).join(' ') + ' ' + allResumeSkills.join(' ');
  const resumeKeywords = extractKeywords(resumeText);
  
  const matchedKeywords: string[] = [];
  jdKeywords.forEach(keyword => {
    if (resumeKeywords.has(keyword)) {
      matchedKeywords.push(keyword);
    }
  });
  
  const keywordMatchScore = jdKeywords.size > 0 
    ? (matchedKeywords.length / jdKeywords.size) * 100 
    : 50;
  
  // 3. Experience Relevance Score (20% weight)
  let experienceScore = 0;
  if (resumeExperience.length > 0) {
    const expScores = resumeExperience.map(exp => {
      const expText = `${exp.title} ${exp.bullets.join(' ')}`;
      return calculateSimilarity(expText, jdText) * 100;
    });
    experienceScore = Math.max(...expScores, 0);
  }
  
  // 4. Title Match Score (10% weight)
  const resumeTitles = resumeExperience.map(exp => normalizeText(exp.title));
  const normalizedJDTitle = normalizeText(jdTitle);
  const titleMatchScore = resumeTitles.some(title => 
    calculateSimilarity(title, normalizedJDTitle) > 0.5
  ) ? 100 : 30;
  
  // Calculate weighted total
  const total = Math.round(
    (skillMatchScore * 0.4) +
    (keywordMatchScore * 0.3) +
    (experienceScore * 0.2) +
    (titleMatchScore * 0.1)
  );
  
  // Generate suggestions
  const suggestions: string[] = [];
  if (missingSkills.length > 0) {
    suggestions.push(`Add missing skills: ${missingSkills.slice(0, 3).join(', ')}`);
  }
  if (keywordMatchScore < 50) {
    suggestions.push('Incorporate more keywords from the job requirements into your experience bullets');
  }
  if (titleMatchScore < 50) {
    suggestions.push('Consider adjusting your job titles to better match the target role');
  }
  
  return {
    total: Math.min(100, Math.max(0, total)),
    breakdown: {
      skillMatch: Math.round(skillMatchScore),
      keywordMatch: Math.round(keywordMatchScore),
      experienceRelevance: Math.round(experienceScore),
      titleMatch: Math.round(titleMatchScore),
    },
    matchedSkills,
    missingSkills,
    matchedKeywords: matchedKeywords.slice(0, 20),
    suggestions,
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
    const originalScore = calculateATSScore(
      jobDescription.skills,
      jobDescription.requirements,
      jobDescription.responsibilities,
      jobDescription.title,
      resume.skills,
      resume.experience,
      [] // No additional skills for original
    );

    // Calculate new score (with confirmed skills and tailored experience)
    let tailoredExp = resume.experience;
    if (tailoredExperience && tailoredExperience.length > 0) {
      // Create experience entries from tailored bullets
      tailoredExp = [{
        title: resume.experience[0]?.title || 'Professional Experience',
        company: resume.experience[0]?.company || 'Company',
        bullets: tailoredExperience.map(e => e.text),
      }];
    }

    const newScore = calculateATSScore(
      jobDescription.skills,
      jobDescription.requirements,
      jobDescription.responsibilities,
      jobDescription.title,
      resume.skills,
      tailoredExp,
      confirmedSkills // Add confirmed skills
    );

    console.log('ATS scores calculated:', { original: originalScore.total, new: newScore.total });

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