import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { BackgroundBlobs } from "@/components/BackgroundBlobs";
import { ChatMessage } from "@/components/ChatMessage";
import { QuickReplyChips } from "@/components/QuickReplyChips";
import { Send, ArrowLeft, Zap } from "lucide-react";

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

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
              style={{
                background: "linear-gradient(135deg, hsl(211 100% 50%), hsl(211 100% 60%))",
                boxShadow: "0 4px 12px hsl(211 100% 50% / 0.2)"
              }}
            >
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-lg">Gap Analysis</span>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-sm text-muted-foreground font-medium">
            {gapsResolved} of {totalGaps} gaps resolved
          </div>
          <div className="w-32 md:w-48">
            <Progress value={progress} className="h-2" />
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

        {/* Quick Replies & Input */}
        <div className="bg-card rounded-2xl p-4 space-y-4 border border-border shadow-lg">
          {gapsResolved < totalGaps && !isTyping && messages.length > 1 && (
            <QuickReplyChips onReply={handleQuickReply} />
          )}
          
          <div className="flex gap-3">
            <Input
              placeholder="Or type your own response..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 rounded-xl border-border"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="rounded-xl"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InterrogationPage;
