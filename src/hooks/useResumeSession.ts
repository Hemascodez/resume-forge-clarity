import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
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
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const createSession = async (data: ResumeSessionData): Promise<string | null> => {
    if (!user) {
      toast.error("You must be logged in to save sessions");
      return null;
    }

    setIsSaving(true);
    try {
      const { data: session, error } = await supabase
        .from("resume_sessions")
        .insert({
          user_id: user.id,
          original_resume_text: data.originalResumeText,
          job_description_text: data.jobDescriptionText,
          jd_title: data.jdTitle,
          jd_company: data.jdCompany,
          jd_skills: data.jdSkills,
          jd_requirements: data.jdRequirements,
          jd_responsibilities: data.jdResponsibilities,
          resume_skills: data.resumeSkills,
          resume_experience: data.resumeExperience as Json,
          conversation_history: (data.conversationHistory || []) as Json,
          gaps_identified: data.gapsIdentified,
          confirmed_skills: data.confirmedSkills,
          tailored_resume: data.tailoredResume,
          old_ats_score: data.oldAtsScore,
          new_ats_score: data.newAtsScore,
          status: data.status || "in_progress",
        })
        .select("id")
        .single();

      if (error) throw error;

      setSessionId(session.id);
      return session.id;
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to save session");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const updateSession = async (
    id: string,
    updates: Partial<ResumeSessionData>
  ): Promise<boolean> => {
    if (!user) return false;

    setIsSaving(true);
    try {
      const updateData: Record<string, unknown> = {};
      
      if (updates.conversationHistory !== undefined) {
        updateData.conversation_history = updates.conversationHistory as Json;
      }
      if (updates.gapsIdentified !== undefined) {
        updateData.gaps_identified = updates.gapsIdentified;
      }
      if (updates.confirmedSkills !== undefined) {
        updateData.confirmed_skills = updates.confirmedSkills;
      }
      if (updates.tailoredResume !== undefined) {
        updateData.tailored_resume = updates.tailoredResume;
      }
      if (updates.oldAtsScore !== undefined) {
        updateData.old_ats_score = updates.oldAtsScore;
      }
      if (updates.newAtsScore !== undefined) {
        updateData.new_ats_score = updates.newAtsScore;
      }
      if (updates.status !== undefined) {
        updateData.status = updates.status;
      }

      const { error } = await supabase
        .from("resume_sessions")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating session:", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const getSession = async (id: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("resume_sessions")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching session:", error);
      return null;
    }
  };

  const getUserSessions = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from("resume_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching sessions:", error);
      return [];
    }
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