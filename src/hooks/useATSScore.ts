import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ATSBreakdown {
  skillMatch: number;
  keywordMatch: number;
  experienceRelevance: number;
  titleMatch: number;
}

interface ATSScoreResult {
  total: number;
  breakdown: ATSBreakdown;
  matchedSkills: string[];
  missingSkills: string[];
  matchedKeywords: string[];
  suggestions: string[];
}

interface ATSCalculationResult {
  originalScore: ATSScoreResult;
  newScore: ATSScoreResult;
  improvement: number;
}

interface JobDescription {
  title: string;
  company: string;
  skills: string[];
  requirements: string[];
  responsibilities: string[];
  rawText?: string;
}

interface Resume {
  skills: string[];
  experience: {
    title: string;
    company: string;
    bullets: string[];
  }[];
  rawText?: string;
}

interface TailoredExperience {
  text: string;
  isModified: boolean;
}

export const useATSScore = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<ATSCalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateScore = useCallback(async (
    jobDescription: JobDescription,
    resume: Resume,
    confirmedSkills: string[] = [],
    tailoredExperience?: TailoredExperience[]
  ) => {
    setIsCalculating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('calculate-ats', {
        body: {
          jobDescription,
          resume,
          confirmedSkills,
          tailoredExperience,
        },
      });

      if (fnError) throw fnError;

      if (data.error) {
        throw new Error(data.error);
      }

      setResult({
        originalScore: data.originalScore,
        newScore: data.newScore,
        improvement: data.improvement,
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate ATS score';
      setError(errorMessage);
      console.error('ATS calculation error:', err);
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    isCalculating,
    result,
    error,
    calculateScore,
    reset,
    oldScore: result?.originalScore.total ?? 0,
    newScore: result?.newScore.total ?? 0,
    improvement: result?.improvement ?? 0,
    matchedSkills: result?.newScore.matchedSkills ?? [],
    missingSkills: result?.newScore.missingSkills ?? [],
    suggestions: result?.newScore.suggestions ?? [],
  };
};