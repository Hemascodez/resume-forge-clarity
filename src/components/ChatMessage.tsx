import React from "react";
import { Bot, Sparkles } from "lucide-react";
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
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center glow-cyan">
          <Bot className="w-5 h-5 text-primary-foreground" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] md:max-w-[70%] rounded-2xl px-5 py-4 backdrop-blur-sm",
          isAI
            ? "glass border-l-2 border-l-primary/50"
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
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-accent" />
        </div>
      )}
    </div>
  );
};
