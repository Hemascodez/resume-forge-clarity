import React from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Edit3 } from "lucide-react";

interface QuickReplyChipsProps {
  onReply: (response: string) => void;
}

export const QuickReplyChips: React.FC<QuickReplyChipsProps> = ({ onReply }) => {
  const chips = [
    { label: "Yes, add that skill", icon: Check, value: "yes" },
    { label: "No, skip it", icon: X, value: "no" },
    { label: "Let me edit", icon: Edit3, value: "edit" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <Button
          key={chip.value}
          variant="chip"
          size="chip"
          onClick={() => onReply(chip.value)}
          className="group"
        >
          <chip.icon className="w-3.5 h-3.5 mr-1 transition-colors group-hover:text-primary" />
          {chip.label}
        </Button>
      ))}
    </div>
  );
};
