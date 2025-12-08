import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  skillBeingProbed?: string;
  context?: string;
}

interface InterrogationState {
  messages: Message[];
  isLoading: boolean;
  isComplete: boolean;
  gapsIdentified: string[];
  confirmedSkills: string[];
  summary: string | null;
}

interface JobDescription {
  title: string;
  company: string;
  skills: string[];
  requirements: string[];
  responsibilities: string[];
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

export const useInterrogation = () => {
  const [state, setState] = useState<InterrogationState>({
    messages: [],
    isLoading: false,
    isComplete: false,
    gapsIdentified: [],
    confirmedSkills: [],
    summary: null,
  });

  const startInterrogation = useCallback(async (jobDescription: JobDescription, resume: Resume) => {
    setState(prev => ({ ...prev, isLoading: true, messages: [] }));

    try {
      const { data, error } = await supabase.functions.invoke('interrogate', {
        body: { jobDescription, resume, conversationHistory: [], userAnswer: null },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.question,
        skillBeingProbed: data.skillBeingProbed,
        context: data.context,
      };

      setState(prev => ({
        ...prev,
        messages: [assistantMessage],
        isLoading: false,
        isComplete: data.isComplete || false,
        gapsIdentified: data.gapsIdentified || [],
        confirmedSkills: data.confirmedSkills || [],
        summary: data.summary || null,
      }));
    } catch (error) {
      console.error('Failed to start interrogation:', error);
      toast.error('Failed to start analysis. Please try again.');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const sendAnswer = useCallback(async (
    answer: string,
    jobDescription: JobDescription,
    resume: Resume
  ) => {
    const userMessage: Message = { role: 'user', content: answer };
    
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
    }));

    try {
      // Build conversation history for the API
      const conversationHistory = [...state.messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const { data, error } = await supabase.functions.invoke('interrogate', {
        body: {
          jobDescription,
          resume,
          conversationHistory,
          userAnswer: answer,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.question || data.summary,
        skillBeingProbed: data.skillBeingProbed,
        context: data.context,
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
        isComplete: data.isComplete || false,
        gapsIdentified: data.gapsIdentified || prev.gapsIdentified,
        confirmedSkills: data.confirmedSkills || prev.confirmedSkills,
        summary: data.summary || prev.summary,
      }));
    } catch (error) {
      console.error('Failed to send answer:', error);
      toast.error('Failed to process your answer. Please try again.');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.messages]);

  const reset = useCallback(() => {
    setState({
      messages: [],
      isLoading: false,
      isComplete: false,
      gapsIdentified: [],
      confirmedSkills: [],
      summary: null,
    });
  }, []);

  return {
    ...state,
    startInterrogation,
    sendAnswer,
    reset,
  };
};
