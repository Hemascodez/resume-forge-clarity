import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { BackgroundBlobs } from "@/components/BackgroundBlobs";
import { ChatMessage } from "@/components/ChatMessage";
import { JoystickButton } from "@/components/JoystickButton";
import { TriggerProgress, ControllerCard, MiniJoystick, JoystickController } from "@/components/JoystickElements";
import { Send, ArrowLeft, Zap, Check, X, Edit3 } from "lucide-react";
import { useInterrogation } from "@/hooks/useInterrogation";
import { useResumeSession } from "@/hooks/useResumeSession";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface LocationState {
  jobDescription: {
    title: string;
    company: string;
    skills: string[];
    requirements: string[];
    responsibilities: string[];
    rawText: string;
  };
  resume: {
    skills: string[];
    experience: {
      title: string;
      company: string;
      bullets: string[];
    }[];
    rawText: string;
  };
}

const InterrogationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const locationState = location.state as LocationState | null;
  const { user } = useAuth();
  const { createSession, updateSession } = useResumeSession();

  const {
    messages,
    isLoading,
    isComplete,
    gapsIdentified,
    confirmedSkills,
    summary,
    startInterrogation,
    sendAnswer,
    reset,
  } = useInterrogation();

  // Start interrogation and create session when page loads with data
  useEffect(() => {
    if (locationState && !hasStarted) {
      setHasStarted(true);
      startInterrogation(locationState.jobDescription, locationState.resume);
      
      // Create session if user is logged in
      if (user) {
        createSession({
          originalResumeText: locationState.resume.rawText,
          jobDescriptionText: locationState.jobDescription.rawText,
          jdTitle: locationState.jobDescription.title,
          jdCompany: locationState.jobDescription.company,
          jdSkills: locationState.jobDescription.skills,
          jdRequirements: locationState.jobDescription.requirements,
          jdResponsibilities: locationState.jobDescription.responsibilities,
          resumeSkills: locationState.resume.skills,
          resumeExperience: locationState.resume.experience,
          status: "in_progress",
        }).then(id => {
          if (id) setCurrentSessionId(id);
        });
      }
    } else if (!locationState && !hasStarted) {
      toast.error("No data found. Please start from the beginning.");
      navigate("/");
    }
  }, [locationState, hasStarted, startInterrogation, navigate, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Update session when messages change
  useEffect(() => {
    if (currentSessionId && messages.length > 0 && user) {
      updateSession(currentSessionId, {
        conversationHistory: messages,
        gapsIdentified,
        confirmedSkills,
      });
    }
  }, [messages, gapsIdentified, confirmedSkills, currentSessionId, user]);

  // Navigate to editor when complete
  useEffect(() => {
    if (isComplete && summary) {
      toast.success("Analysis complete! Preparing your tailored resume...");
      setTimeout(() => {
        navigate("/editor", {
          state: {
            sessionId: currentSessionId,
            jobDescription: locationState?.jobDescription,
            resume: locationState?.resume,
            gapsIdentified,
            confirmedSkills,
            summary,
          },
        });
      }, 2000);
    }
  }, [isComplete, summary, navigate, locationState, gapsIdentified, confirmedSkills, currentSessionId]);

  const handleQuickReply = (response: "yes" | "no" | "edit") => {
    if (!locationState) return;

    const responseMap: Record<string, string> = {
      yes: "Yes, I have experience with that. Please add it to my resume.",
      no: "No, I don't have that specific experience. Let's skip it.",
      edit: "Let me provide more details about my experience...",
    };

    sendAnswer(responseMap[response], locationState.jobDescription, locationState.resume);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || !locationState) return;
    sendAnswer(inputValue, locationState.jobDescription, locationState.resume);
    setInputValue("");
  };

  // Calculate progress based on conversation flow
  const totalExpectedQuestions = Math.max(gapsIdentified.length, 3);
  const answeredQuestions = Math.floor(messages.filter(m => m.role === "user").length);
  const progress = isComplete ? 100 : Math.min((answeredQuestions / totalExpectedQuestions) * 100, 95);

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col bg-background">
      <BackgroundBlobs variant="chat" />

      {/* Decorative Controller */}
      <div className="absolute top-40 -right-32 opacity-10 rotate-[20deg] pointer-events-none hidden lg:block">
        <JoystickController />
      </div>

      {/* Header with Controller Style */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <JoystickButton variant="neutral" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4" />
          </JoystickButton>
          <div className="flex items-center gap-3">
            <JoystickButton variant="primary" size="sm">
              <Zap className="w-4 h-4" />
            </JoystickButton>
            <span className="font-bold text-foreground text-lg">Gap Analysis</span>
          </div>
        </div>

        {/* Progress indicator - Controller trigger style */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <MiniJoystick variant="accent" className="w-8 h-8" />
            <span className="text-sm text-muted-foreground font-medium">
              {confirmedSkills.length} verified
            </span>
          </div>
          <div className="w-32 md:w-48">
            <TriggerProgress value={progress} />
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <main className="relative z-10 flex-1 container mx-auto max-w-3xl px-4 py-6 overflow-hidden flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4 scrollbar-thin">
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role === "assistant" ? "ai" : "user"}
              content={message.content}
            />
          ))}

          {isLoading && <ChatMessage role="ai" content="" isTyping />}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies & Input - Controller Style */}
        <ControllerCard className="space-y-4">
          {!isComplete && !isLoading && messages.length > 0 && (
            <div className="flex flex-wrap gap-3 justify-center">
              <JoystickButton variant="accent" size="md" onClick={() => handleQuickReply("yes")}>
                <Check className="w-5 h-5" />
              </JoystickButton>
              <JoystickButton
                variant="neutral"
                size="md"
                onClick={() => handleQuickReply("no")}
                className="border-destructive text-destructive"
              >
                <X className="w-5 h-5" />
              </JoystickButton>
              <JoystickButton variant="primary" size="md" onClick={() => handleQuickReply("edit")}>
                <Edit3 className="w-5 h-5" />
              </JoystickButton>
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex-1 rounded-2xl bg-gradient-to-b from-muted to-secondary border-2 border-border p-1 shadow-[inset_0_4px_12px_rgba(0,0,0,0.08)]">
              <Input
                placeholder="Type your response..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={isLoading || isComplete}
                className="border-0 bg-card/80 rounded-xl focus-visible:ring-0"
              />
            </div>
            <JoystickButton
              variant="primary"
              size="md"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading || isComplete}
            >
              <Send className="w-5 h-5" />
            </JoystickButton>
          </div>
        </ControllerCard>
      </main>
    </div>
  );
};

export default InterrogationPage;
