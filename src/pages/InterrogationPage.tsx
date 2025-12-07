import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BackgroundBlobs } from "@/components/BackgroundBlobs";
import { ChatMessage } from "@/components/ChatMessage";
import { QuickReplyChips } from "@/components/QuickReplyChips";
import { JoystickButton } from "@/components/JoystickButton";
import { TriggerProgress, ControllerCard, MiniJoystick, JoystickController } from "@/components/JoystickElements";
import { Send, ArrowLeft, Zap, Check, X, Edit3 } from "lucide-react";

interface Message {
  id: number;
  role: "ai" | "user";
  content: string;
}

const mockQuestions = [
  "The JD requires React Native experience. You only listed React. Have you worked with React Native?",
  "I see the role needs GraphQL expertise. Your resume mentions REST APIs. Do you have GraphQL experience?",
  "The position requires team leadership. You have 'collaborated with teams' listed. Have you directly led or managed a team?",
  "TypeScript is listed as a requirement. You have JavaScript listed. Are you proficient in TypeScript?",
  "The JD mentions CI/CD pipelines. I don't see this on your resume. Have you set up or maintained CI/CD systems?",
];

const InterrogationPage: React.FC = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [gapsResolved, setGapsResolved] = useState(0);
  const totalGaps = mockQuestions.length;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setMessages([
          {
            id: 1,
            role: "ai",
            content:
              "I've analyzed your resume against the job description. I found some gaps we need to verify together. I'll ask you about each one to ensure accuracy. Let's begin!",
          },
        ]);
        setIsTyping(false);
        
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              { id: 2, role: "ai", content: mockQuestions[0] },
            ]);
            setIsTyping(false);
          }, 1500);
        }, 500);
      }, 2000);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleQuickReply = (response: string) => {
    const responseMap: Record<string, string> = {
      yes: "Yes, I have experience with that. Please add it to my resume.",
      no: "No, I don't have that specific experience. Let's skip it.",
      edit: "Let me provide more details about my experience...",
    };

    const userMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: responseMap[response],
    };

    setMessages((prev) => [...prev, userMessage]);
    setGapsResolved((prev) => prev + 1);

    if (currentQuestion < totalGaps - 1) {
      setIsTyping(true);
      setTimeout(() => {
        const nextQ = currentQuestion + 1;
        setCurrentQuestion(nextQ);
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            role: "ai",
            content: response === "yes" 
              ? `Great! I've noted that. ${mockQuestions[nextQ]}`
              : response === "no"
              ? `Understood, we'll keep it accurate. ${mockQuestions[nextQ]}`
              : `Got it, let me know the details. ${mockQuestions[nextQ]}`,
          },
        ]);
        setIsTyping(false);
      }, 1500);
    } else {
      setIsTyping(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            role: "ai",
            content:
              "Excellent! I've verified all the gaps. Your resume is now tailored with 100% verified information. Let's review the final result!",
          },
        ]);
        setIsTyping(false);
        
        setTimeout(() => {
          navigate("/editor");
        }, 2000);
      }, 1500);
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    
    handleQuickReply("edit");
  };

  const progress = ((gapsResolved) / totalGaps) * 100;

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
          <JoystickButton 
            variant="neutral" 
            size="sm" 
            onClick={() => navigate("/")}
          >
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
              {gapsResolved}/{totalGaps}
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
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
            />
          ))}
          
          {isTyping && (
            <ChatMessage role="ai" content="" isTyping />
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies & Input - Controller Style */}
        <ControllerCard className="space-y-4">
          {gapsResolved < totalGaps && !isTyping && messages.length > 1 && (
            <div className="flex flex-wrap gap-3 justify-center">
              <JoystickButton variant="accent" size="md" onClick={() => handleQuickReply("yes")}>
                <Check className="w-5 h-5" />
              </JoystickButton>
              <JoystickButton variant="neutral" size="md" onClick={() => handleQuickReply("no")}>
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
                className="border-0 bg-card/80 rounded-xl focus-visible:ring-0"
              />
            </div>
            <JoystickButton 
              variant="primary" 
              size="md" 
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
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
