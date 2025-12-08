import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FileText, Download, X } from "lucide-react";
import { JoystickButton } from "@/components/JoystickButton";

interface ExperienceItem {
  text: string;
  isModified: boolean;
}

interface ExperienceEntry {
  title: string;
  company: string;
  bullets: string[];
}

interface ResumePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: () => void;
  resumeData: {
    name: string;
    title: string;
    skills: string[];
    experience: ExperienceItem[];
    originalExperience?: ExperienceEntry[];
  };
  jobTitle?: string;
  company?: string;
  confirmedSkills: string[];
  originalSkills: string[];
}

export const ResumePreviewModal: React.FC<ResumePreviewModalProps> = ({
  open,
  onOpenChange,
  onDownload,
  resumeData,
  jobTitle,
  company,
  confirmedSkills,
  originalSkills,
}) => {
  const newSkills = confirmedSkills.filter(
    skill => !originalSkills.some(os => os.toLowerCase() === skill.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border bg-secondary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Resume Preview</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Review your tailored resume before downloading
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh]">
          <div className="p-8 bg-background">
            {/* Resume Document Preview */}
            <div className="bg-card border border-border rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
              {/* Tailored For Badge */}
              {jobTitle && company && (
                <div className="mb-6 text-right">
                  <span className="text-xs italic text-muted-foreground">
                    Tailored for: {jobTitle} at {company}
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-6 pb-6 border-b border-border">
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  {resumeData.name}
                </h1>
                <p className="text-primary font-medium mb-2">{resumeData.title}</p>
                <p className="text-xs text-muted-foreground">
                  email@example.com • (555) 123-4567 • Location
                </p>
              </div>

              {/* Summary/Objective - AI generated based on job */}
              {jobTitle && (
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">
                    Professional Summary
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Experienced {resumeData.title} with expertise in {resumeData.skills.slice(0, 3).join(', ')}. 
                    Seeking to leverage skills and experience as {jobTitle} at {company}.
                  </p>
                </div>
              )}

              {/* Skills Section - Shows ALL skills (original + new) */}
              <div className="mb-6">
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {/* Original skills */}
                  {originalSkills.map((skill, idx) => (
                    <Badge
                      key={`orig-${idx}`}
                      variant="secondary"
                      className="text-xs"
                    >
                      {skill}
                    </Badge>
                  ))}
                  {/* Newly confirmed skills (highlighted) */}
                  {newSkills.map((skill, idx) => (
                    <Badge
                      key={`new-${idx}`}
                      className="text-xs bg-accent/20 text-accent border border-accent/30"
                    >
                      {skill} ✓
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Experience Section - Shows ALL experience with enhancements highlighted */}
              <div className="mb-6">
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">
                  Professional Experience
                </h2>
                
                {/* Show original experience structure if available */}
                {resumeData.originalExperience && resumeData.originalExperience.length > 0 ? (
                  <div className="space-y-4">
                    {resumeData.originalExperience.map((exp, expIdx) => (
                      <div key={expIdx} className="mb-4">
                        <div className="flex justify-between items-baseline mb-2">
                          <h3 className="font-semibold text-foreground text-sm">{exp.title}</h3>
                          <span className="text-xs text-muted-foreground">{exp.company}</span>
                        </div>
                        <ul className="space-y-2">
                          {exp.bullets.map((bullet, bulletIdx) => (
                            <li key={bulletIdx} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    
                    {/* AI-enhanced bullets section */}
                    {resumeData.experience.filter(e => e.isModified).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-dashed border-accent/30">
                        <p className="text-xs text-accent font-medium mb-2">✨ AI-Enhanced Additions:</p>
                        <ul className="space-y-2">
                          {resumeData.experience.filter(e => e.isModified).map((item, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-sm p-2 rounded-lg bg-accent/5 border-l-2 border-accent"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                              <span className="text-accent">{item.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Fallback: Show all experience items in a simple list */
                  <ul className="space-y-3">
                    {resumeData.experience.map((item, idx) => (
                      <li
                        key={idx}
                        className={cn(
                          "flex items-start gap-3 text-sm leading-relaxed p-2 rounded-lg transition-colors",
                          item.isModified && "bg-accent/5 border-l-2 border-accent"
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full mt-2 shrink-0",
                            item.isModified ? "bg-accent" : "bg-primary"
                          )}
                        />
                        <span className={cn(
                          item.isModified && "text-accent font-medium"
                        )}>
                          {item.text}
                          {item.isModified && (
                            <span className="ml-2 text-xs text-accent/70">(enhanced)</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Education Section (placeholder) */}
              <div>
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">
                  Education
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your education details from original resume
                </p>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-border text-center">
                <p className="text-xs text-muted-foreground">
                  Generated with ResumeAI • {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-accent" />
                <span>Enhanced/Added content</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary" />
                <span>Original content</span>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border bg-secondary/30 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {resumeData.experience.filter(e => e.isModified).length} enhancements • {newSkills.length} new skills verified
          </p>
          <div className="flex items-center gap-3">
            <JoystickButton
              variant="neutral"
              size="md"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </JoystickButton>
            <JoystickButton
              variant="accent"
              size="md"
              onClick={() => {
                onDownload();
                onOpenChange(false);
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Resume
            </JoystickButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
