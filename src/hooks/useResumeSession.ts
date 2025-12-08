import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface ResumeSessionData {
  originalResumeText: string;
  jobDescriptionText: string;
  jdTitle?: string;
  jdCompany?: string;
  jdSkills?: string[];
  jdRequirements?: string[];
  jdResponsibilities?: string[];
  resumeSkills?: string[];
  resumeExperience?: { title: string; company: string; bullets: string[] }[];
  conversationHistory?: { role: string; content: string }[];
  gapsIdentified?: string[];
  confirmedSkills?: string[];
  tailoredResume?: Json;
  oldAtsScore?: number;
  newAtsScore?: number;
  status?: "in_progress" | "completed" | "abandoned";
}

export function useResumeSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const createSession = async (_data: ResumeSessionData): Promise<string | null> => {
    // Session creation disabled - no auth
    return null;
  };

  const updateSession = async (
    _id: string,
    _updates: Partial<ResumeSessionData>
  ): Promise<boolean> => {
    // Session update disabled - no auth
    return false;
  };

  const getSession = async (_id: string) => {
    // Session fetch disabled - no auth
    return null;
  };

  const getUserSessions = async () => {
    // Session list disabled - no auth
    return [];
  };


  return {
    sessionId,
    isSaving,
    createSession,
    updateSession,
    getSession,
    getUserSessions,
  };
}