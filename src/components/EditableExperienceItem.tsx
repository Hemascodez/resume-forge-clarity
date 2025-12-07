import React, { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface EditableExperienceItemProps {
  text: string;
  isModified?: boolean;
  onSave: (newText: string) => void;
}

export const EditableExperienceItem: React.FC<EditableExperienceItemProps> = ({
  text,
  isModified = false,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text);

  const handleSave = () => {
    onSave(editText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(text);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-2 p-3 rounded-xl bg-secondary/50 border border-border">
        <Textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="min-h-[60px] text-sm rounded-lg border-border"
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 px-3">
            <X className="w-3.5 h-3.5 mr-1" />
            Cancel
          </Button>
          <Button size="sm" variant="accent" onClick={handleSave} className="h-8 px-3">
            <Check className="w-3.5 h-3.5 mr-1" />
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-start gap-2 py-2.5 px-3 rounded-xl transition-all hover:bg-secondary/50 cursor-pointer",
        isModified && "bg-accent/5 border-l-2 border-l-accent"
      )}
      onClick={() => setIsEditing(true)}
    >
      <span className="flex-1 text-sm text-foreground leading-relaxed">{text}</span>
      <Button
        size="icon"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 rounded-lg"
      >
        <Pencil className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};
