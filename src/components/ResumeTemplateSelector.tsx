import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FileText, Download, X, Check, Sparkles } from "lucide-react";
import { JoystickButton } from "@/components/JoystickButton";

export type TemplateType = 'modern' | 'classic' | 'minimal' | 'executive';

interface TemplateOption {
  id: TemplateType;
  name: string;
  description: string;
  bestFor: string;
  preview: React.ReactNode;
}

interface ExperienceEntry {
  title: string;
  company: string;
  bullets: string[];
}

interface ResumeTemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: TemplateType) => void;
  resumeData: {
    name: string;
    title: string;
    skills: string[];
    experience: { text: string; isModified: boolean }[];
    originalExperience?: ExperienceEntry[];
  };
  jobTitle?: string;
  company?: string;
  confirmedSkills: string[];
  originalSkills: string[];
}

const TemplatePreview: React.FC<{
  template: TemplateType;
  resumeData: ResumeTemplateSelectorProps['resumeData'];
  confirmedSkills: string[];
  originalSkills: string[];
  jobTitle?: string;
  company?: string;
}> = ({ template, resumeData, confirmedSkills, originalSkills, jobTitle, company }) => {
  const newSkills = confirmedSkills.filter(
    skill => !originalSkills.some(os => os.toLowerCase() === skill.toLowerCase())
  );

  const allSkills = [...originalSkills, ...newSkills];

  if (template === 'modern') {
    return (
      <div className="bg-card p-4 rounded-lg border border-border text-[8px] leading-tight">
        <div className="border-l-4 border-primary pl-3 mb-3">
          <h1 className="text-[12px] font-bold text-foreground">{resumeData.name}</h1>
          <p className="text-primary font-medium">{resumeData.title}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {allSkills.slice(0, 6).map((s, i) => (
            <span key={i} className="bg-primary/10 text-primary px-1 py-0.5 rounded text-center truncate">
              {s}
            </span>
          ))}
        </div>
        <div className="space-y-1">
          {resumeData.experience.slice(0, 2).map((exp, i) => (
            <div key={i} className="border-l-2 border-accent pl-2">
              <p className="text-muted-foreground truncate">• {exp.text.slice(0, 40)}...</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (template === 'classic') {
    return (
      <div className="bg-card p-4 rounded-lg border border-border text-[8px] leading-tight">
        <div className="text-center border-b border-border pb-2 mb-2">
          <h1 className="text-[12px] font-bold text-foreground uppercase tracking-wider">{resumeData.name}</h1>
          <p className="text-muted-foreground">{resumeData.title}</p>
        </div>
        <div className="mb-2">
          <h3 className="font-bold uppercase text-[7px] tracking-wider border-b border-border mb-1">Skills</h3>
          <p className="text-muted-foreground">{allSkills.slice(0, 5).join(' • ')}</p>
        </div>
        <div>
          <h3 className="font-bold uppercase text-[7px] tracking-wider border-b border-border mb-1">Experience</h3>
          {resumeData.experience.slice(0, 2).map((exp, i) => (
            <p key={i} className="text-muted-foreground">• {exp.text.slice(0, 35)}...</p>
          ))}
        </div>
      </div>
    );
  }

  if (template === 'minimal') {
    return (
      <div className="bg-card p-4 rounded-lg border border-border text-[8px] leading-tight">
        <div className="mb-3">
          <h1 className="text-[12px] font-bold text-foreground">{resumeData.name}</h1>
          <p className="text-muted-foreground text-[7px]">{resumeData.title} • {allSkills.slice(0, 3).join(', ')}</p>
        </div>
        <div className="space-y-2">
          {resumeData.experience.slice(0, 3).map((exp, i) => (
            <p key={i} className="text-muted-foreground">
              {exp.text.slice(0, 50)}...
            </p>
          ))}
        </div>
      </div>
    );
  }

  // Executive
  return (
    <div className="bg-card p-4 rounded-lg border-2 border-primary/20 text-[8px] leading-tight">
      <div className="bg-primary/5 -m-4 mb-2 p-3 border-b border-primary/20">
        <h1 className="text-[12px] font-bold text-foreground">{resumeData.name}</h1>
        <p className="text-primary font-semibold">{resumeData.title}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2 pt-2">
        <div>
          <h3 className="font-bold text-primary text-[7px] mb-1">Core Competencies</h3>
          <div className="space-y-0.5">
            {allSkills.slice(0, 3).map((s, i) => (
              <p key={i} className="text-muted-foreground">✓ {s}</p>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-bold text-primary text-[7px] mb-1">Achievements</h3>
          {resumeData.experience.slice(0, 2).map((exp, i) => (
            <p key={i} className="text-muted-foreground truncate">• {exp.text.slice(0, 25)}...</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ResumeTemplateSelector: React.FC<ResumeTemplateSelectorProps> = ({
  open,
  onOpenChange,
  onSelectTemplate,
  resumeData,
  jobTitle,
  company,
  confirmedSkills,
  originalSkills,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('modern');

  const templates: TemplateOption[] = [
    {
      id: 'modern',
      name: 'Modern',
      description: 'Clean design with accent colors and sidebar layout',
      bestFor: 'Tech, Startups, Design',
      preview: null,
    },
    {
      id: 'classic',
      name: 'Classic',
      description: 'Traditional format that works with all ATS systems',
      bestFor: 'Corporate, Finance, Legal',
      preview: null,
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Simple, text-focused layout for maximum readability',
      bestFor: 'Academics, Consulting, Research',
      preview: null,
    },
    {
      id: 'executive',
      name: 'Executive',
      description: 'Premium look for senior positions',
      bestFor: 'Leadership, C-Suite, Directors',
      preview: null,
    },
  ];

  const handleDownload = () => {
    onSelectTemplate(selectedTemplate);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Choose Your Template</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Select an ATS-friendly template for your tailored resume
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh]">
          <div className="p-6">
            {/* Template Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={cn(
                    "relative rounded-xl border-2 p-3 transition-all hover:border-primary/50 text-left",
                    selectedTemplate === template.id
                      ? "border-primary bg-primary/5 shadow-lg"
                      : "border-border bg-card hover:bg-secondary/50"
                  )}
                >
                  {selectedTemplate === template.id && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  <TemplatePreview
                    template={template.id}
                    resumeData={resumeData}
                    confirmedSkills={confirmedSkills}
                    originalSkills={originalSkills}
                    jobTitle={jobTitle}
                    company={company}
                  />
                  <div className="mt-3">
                    <h3 className="font-semibold text-foreground text-sm">{template.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                    <Badge variant="secondary" className="mt-2 text-[10px]">
                      {template.bestFor}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>

            {/* Full Preview */}
            <div className="bg-secondary/30 rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Preview: {templates.find(t => t.id === selectedTemplate)?.name} Template
              </h3>
              <div className="bg-card border border-border rounded-lg p-6 max-w-2xl mx-auto shadow-lg">
                {selectedTemplate === 'modern' && (
                  <ModernTemplatePreview
                    resumeData={resumeData}
                    confirmedSkills={confirmedSkills}
                    originalSkills={originalSkills}
                    jobTitle={jobTitle}
                    company={company}
                  />
                )}
                {selectedTemplate === 'classic' && (
                  <ClassicTemplatePreview
                    resumeData={resumeData}
                    confirmedSkills={confirmedSkills}
                    originalSkills={originalSkills}
                    jobTitle={jobTitle}
                    company={company}
                  />
                )}
                {selectedTemplate === 'minimal' && (
                  <MinimalTemplatePreview
                    resumeData={resumeData}
                    confirmedSkills={confirmedSkills}
                    originalSkills={originalSkills}
                    jobTitle={jobTitle}
                    company={company}
                  />
                )}
                {selectedTemplate === 'executive' && (
                  <ExecutiveTemplatePreview
                    resumeData={resumeData}
                    confirmedSkills={confirmedSkills}
                    originalSkills={originalSkills}
                    jobTitle={jobTitle}
                    company={company}
                  />
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border bg-secondary/30 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            All templates are ATS-optimized for maximum compatibility
          </p>
          <div className="flex items-center gap-3">
            <JoystickButton
              variant="neutral"
              size="md"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </JoystickButton>
            <JoystickButton
              variant="accent"
              size="md"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-2" />
              Download {templates.find(t => t.id === selectedTemplate)?.name}
            </JoystickButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Full Template Previews
interface FullPreviewProps {
  resumeData: ResumeTemplateSelectorProps['resumeData'];
  confirmedSkills: string[];
  originalSkills: string[];
  jobTitle?: string;
  company?: string;
}

const ModernTemplatePreview: React.FC<FullPreviewProps> = ({
  resumeData,
  confirmedSkills,
  originalSkills,
  jobTitle,
  company,
}) => {
  const newSkills = confirmedSkills.filter(
    skill => !originalSkills.some(os => os.toLowerCase() === skill.toLowerCase())
  );
  const allSkills = [...originalSkills, ...newSkills];

  return (
    <div className="text-xs">
      {jobTitle && company && (
        <p className="text-[10px] text-muted-foreground italic text-right mb-4">
          Tailored for: {jobTitle} at {company}
        </p>
      )}
      <div className="border-l-4 border-primary pl-4 mb-4">
        <h1 className="text-xl font-bold text-foreground">{resumeData.name}</h1>
        <p className="text-primary font-semibold">{resumeData.title}</p>
        <p className="text-muted-foreground text-[10px]">email@example.com • (555) 123-4567</p>
      </div>

      <div className="mb-4">
        <h2 className="text-sm font-bold text-foreground border-b border-primary/30 pb-1 mb-2">Skills</h2>
        <div className="flex flex-wrap gap-1.5">
          {allSkills.map((skill, i) => (
            <span
              key={i}
              className={cn(
                "px-2 py-0.5 rounded text-[10px]",
                newSkills.includes(skill)
                  ? "bg-accent/20 text-accent border border-accent/30"
                  : "bg-primary/10 text-primary"
              )}
            >
              {skill}{newSkills.includes(skill) && ' ✓'}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-foreground border-b border-primary/30 pb-1 mb-2">Experience</h2>
        {resumeData.originalExperience?.map((exp, i) => (
          <div key={i} className="mb-3">
            <div className="flex justify-between items-baseline">
              <h3 className="font-semibold text-foreground">{exp.title}</h3>
              <span className="text-muted-foreground text-[10px]">{exp.company}</span>
            </div>
            <ul className="mt-1 space-y-0.5">
              {exp.bullets.slice(0, 3).map((bullet, j) => (
                <li key={j} className="flex items-start gap-1.5 text-muted-foreground">
                  <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {resumeData.experience.filter(e => e.isModified).length > 0 && (
          <div className="mt-2 pt-2 border-t border-dashed border-accent/30">
            <p className="text-[10px] text-accent font-medium mb-1">✨ Verified Additions:</p>
            <ul className="space-y-0.5">
              {resumeData.experience.filter(e => e.isModified).slice(0, 3).map((exp, i) => (
                <li key={i} className="flex items-start gap-1.5 text-accent">
                  <span className="w-1 h-1 rounded-full bg-accent mt-1.5 shrink-0" />
                  {exp.text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const ClassicTemplatePreview: React.FC<FullPreviewProps> = ({
  resumeData,
  confirmedSkills,
  originalSkills,
  jobTitle,
  company,
}) => {
  const newSkills = confirmedSkills.filter(
    skill => !originalSkills.some(os => os.toLowerCase() === skill.toLowerCase())
  );
  const allSkills = [...originalSkills, ...newSkills];

  return (
    <div className="text-xs">
      {jobTitle && company && (
        <p className="text-[10px] text-muted-foreground italic text-right mb-2">
          Tailored for: {jobTitle} at {company}
        </p>
      )}
      <div className="text-center border-b-2 border-foreground pb-3 mb-4">
        <h1 className="text-xl font-bold text-foreground uppercase tracking-widest">{resumeData.name}</h1>
        <p className="text-muted-foreground">{resumeData.title}</p>
        <p className="text-muted-foreground text-[10px]">email@example.com | (555) 123-4567 | Location</p>
      </div>

      <div className="mb-4">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-foreground mb-2">
          Professional Skills
        </h2>
        <p className="text-muted-foreground">{allSkills.join(' • ')}</p>
      </div>

      <div>
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-foreground mb-2">
          Professional Experience
        </h2>
        {resumeData.originalExperience?.map((exp, i) => (
          <div key={i} className="mb-3">
            <div className="flex justify-between">
              <h3 className="font-semibold text-foreground">{exp.title}</h3>
              <span className="text-muted-foreground">{exp.company}</span>
            </div>
            <ul className="mt-1">
              {exp.bullets.slice(0, 3).map((bullet, j) => (
                <li key={j} className="text-muted-foreground">• {bullet}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

const MinimalTemplatePreview: React.FC<FullPreviewProps> = ({
  resumeData,
  confirmedSkills,
  originalSkills,
  jobTitle,
  company,
}) => {
  const newSkills = confirmedSkills.filter(
    skill => !originalSkills.some(os => os.toLowerCase() === skill.toLowerCase())
  );
  const allSkills = [...originalSkills, ...newSkills];

  return (
    <div className="text-xs">
      {jobTitle && company && (
        <p className="text-[10px] text-muted-foreground italic mb-4">
          For: {jobTitle}, {company}
        </p>
      )}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground">{resumeData.name}</h1>
        <p className="text-muted-foreground">{resumeData.title} • {allSkills.slice(0, 4).join(', ')}</p>
      </div>

      <div className="space-y-3">
        {resumeData.originalExperience?.map((exp, i) => (
          <div key={i}>
            <p className="font-semibold text-foreground">{exp.title} — {exp.company}</p>
            {exp.bullets.slice(0, 2).map((bullet, j) => (
              <p key={j} className="text-muted-foreground ml-4">• {bullet}</p>
            ))}
          </div>
        ))}
      </div>

      {newSkills.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-accent text-[10px]">Additional verified skills: {newSkills.join(', ')}</p>
        </div>
      )}
    </div>
  );
};

const ExecutiveTemplatePreview: React.FC<FullPreviewProps> = ({
  resumeData,
  confirmedSkills,
  originalSkills,
  jobTitle,
  company,
}) => {
  const newSkills = confirmedSkills.filter(
    skill => !originalSkills.some(os => os.toLowerCase() === skill.toLowerCase())
  );
  const allSkills = [...originalSkills, ...newSkills];

  return (
    <div className="text-xs">
      <div className="bg-primary/5 -m-6 mb-4 p-6 border-b-2 border-primary">
        {jobTitle && company && (
          <p className="text-[10px] text-primary/70 italic mb-2">
            Prepared for: {jobTitle} at {company}
          </p>
        )}
        <h1 className="text-xl font-bold text-foreground">{resumeData.name}</h1>
        <p className="text-primary font-semibold text-sm">{resumeData.title}</p>
        <p className="text-muted-foreground text-[10px] mt-1">email@example.com | (555) 123-4567</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-bold text-primary mb-2">Core Competencies</h2>
          <ul className="space-y-1">
            {allSkills.slice(0, 6).map((skill, i) => (
              <li key={i} className="flex items-center gap-2 text-muted-foreground">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  newSkills.includes(skill) ? "bg-accent" : "bg-primary"
                )} />
                {skill}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold text-primary mb-2">Key Achievements</h2>
          <ul className="space-y-1">
            {resumeData.experience.slice(0, 4).map((exp, i) => (
              <li key={i} className="flex items-start gap-2 text-muted-foreground">
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                  exp.isModified ? "bg-accent" : "bg-primary"
                )} />
                {exp.text.slice(0, 60)}...
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
