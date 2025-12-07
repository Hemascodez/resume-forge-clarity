import React from "react";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "ai" | "user";
  content: string;
  isTyping?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  isTyping = false,
}) => {
  const isAI = role === "ai";

  return (
    <div
      className={cn(
        "flex gap-3 animate-slide-up",
        isAI ? "justify-start" : "justify-end"
      )}
    >
      {isAI && (
        <div 
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
          style={{
            background: "linear-gradient(135deg, hsl(211 100% 50%), hsl(211 100% 60%))",
            boxShadow: "0 4px 12px hsl(211 100% 50% / 0.3)"
          }}
        >
          <Bot className="w-5 h-5 text-primary-foreground" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] md:max-w-[70%] rounded-2xl px-5 py-4 shadow-md",
          isAI
            ? "bg-card border border-border"
            : "bg-primary text-primary-foreground"
        )}
      >
        {isTyping ? (
          <div className="flex items-center gap-2">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        ) : (
          <p className="text-sm md:text-base leading-relaxed">{content}</p>
        )}
      </div>

      {!isAI && (
        <div 
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
          style={{
            background: "linear-gradient(135deg, hsl(142 76% 45%), hsl(142 76% 55%))",
            boxShadow: "0 4px 12px hsl(142 76% 45% / 0.3)"
          }}
        >
          <User className="w-5 h-5 text-accent-foreground" />
        </div>
      )}
    </div>
  );
};
