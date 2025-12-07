import React from "react";
import { cn } from "@/lib/utils";

interface HighlightedTextProps {
  text: string;
  highlights: string[];
  highlightClassName?: string;
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  highlights,
  highlightClassName = "text-primary font-medium bg-primary/10 px-1 rounded",
}) => {
  if (!highlights.length) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(`(${highlights.join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) => {
        const isHighlight = highlights.some(
          (h) => h.toLowerCase() === part.toLowerCase()
        );
        return isHighlight ? (
          <span key={index} className={highlightClassName}>
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </span>
  );
};

interface ModifiedBulletProps {
  text: string;
  isModified?: boolean;
}

export const ModifiedBullet: React.FC<ModifiedBulletProps> = ({
  text,
  isModified = false,
}) => {
  return (
    <li
      className={cn(
        "py-2 px-3 rounded-lg transition-colors",
        isModified && "bg-primary/5 border-l-2 border-l-primary"
      )}
    >
      {text}
    </li>
  );
};
