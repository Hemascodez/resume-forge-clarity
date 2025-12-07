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
      <div className="space-y-2 p-2 rounded-lg bg-secondary/30">
        <Textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="min-h-[60px] text-sm"
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 px-2">
            <X className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" onClick={handleSave} className="h-7 px-3">
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
        "group flex items-start gap-2 py-2 px-3 rounded-lg transition-colors hover:bg-secondary/30",
        isModified && "bg-primary/5 border-l-2 border-l-primary"
      )}
    >
      <span className="flex-1 text-sm">{text}</span>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <Pencil className="w-3 h-3" />
      </Button>
    </div>
  );
};
