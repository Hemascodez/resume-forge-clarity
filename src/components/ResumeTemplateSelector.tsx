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

export type TemplateType = 'creative' | 'professional' | 'sidebar' | 'bold' | 'compact';

interface TemplateOption {
  id: TemplateType;
  name: string;
  description: string;
  bestFor: string;
}

interface ExperienceEntry {
  title: string;
  company: string;
  date?: string;
  bullets: string[];
}

interface ResumeTemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: TemplateType) => void;
  resumeData: {
    name: string;
    title: string;
    email?: string;
    phone?: string;
    website?: string;
    summary?: string;
    skills: string[];
    tools?: string[];
    experience: { text: string; isModified: boolean }[];
    originalExperience?: ExperienceEntry[];
    education?: { degree: string; school: string; date?: string }[];
  };
  jobTitle?: string;
  company?: string;
  confirmedSkills: string[];
  originalSkills: string[];
}

// Mini preview component for template cards
const TemplatePreview: React.FC<{
  template: TemplateType;
  resumeData: ResumeTemplateSelectorProps['resumeData'];
  confirmedSkills: string[];
  originalSkills: string[];
}> = ({ template, resumeData, confirmedSkills, originalSkills }) => {
  const newSkills = confirmedSkills.filter(
    skill => !originalSkills.some(os => os.toLowerCase() === skill.toLowerCase())
  );
  const allSkills = [...originalSkills, ...newSkills];

  if (template === 'creative') {
    return (
      <div className="bg-card p-2 rounded border border-border text-[6px] leading-tight h-24 overflow-hidden">
        <div className="flex gap-1 h-full">
          <div className="flex-1">
            <p className="font-bold text-[8px] text-foreground truncate">{resumeData.name}</p>
            <p className="text-muted-foreground text-[5px]">{resumeData.title}</p>
            <p className="text-[5px] text-muted-foreground mt-1 italic truncate">{resumeData.summary?.slice(0, 30)}...</p>
            <p className="font-semibold mt-1 text-foreground">Experience</p>
            <p className="text-muted-foreground truncate">• {resumeData.experience[0]?.text.slice(0, 25)}...</p>
          </div>
          <div className="w-1/3 bg-secondary/50 p-1 rounded text-[5px]">
            <p className="font-semibold text-foreground">Contact</p>
            <p className="text-muted-foreground truncate">{resumeData.email}</p>
            <p className="font-semibold text-foreground mt-1">Skills</p>
            {allSkills.slice(0, 3).map((s, i) => (
              <p key={i} className="text-muted-foreground">• {s}</p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (template === 'professional') {
    return (
      <div className="bg-card p-2 rounded border border-border text-[6px] leading-tight h-24 overflow-hidden">
        <div className="flex justify-between mb-1">
          <div>
            <p className="font-bold text-[8px] text-foreground">{resumeData.name},</p>
            <p className="font-bold text-[7px] text-foreground">{resumeData.title}</p>
          </div>
          <div className="text-right text-[5px] text-muted-foreground">
            <p>{resumeData.email}</p>
            <p>{resumeData.phone}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <p className="font-semibold text-foreground">Experience</p>
            <p className="text-muted-foreground truncate">• {resumeData.experience[0]?.text.slice(0, 20)}...</p>
          </div>
          <div className="w-1/3">
            <p className="font-semibold text-foreground">Skills</p>
            {allSkills.slice(0, 3).map((s, i) => (
              <p key={i} className="text-muted-foreground truncate">• {s}</p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (template === 'sidebar') {
    return (
      <div className="bg-card p-2 rounded border border-border text-[6px] leading-tight h-24 overflow-hidden">
        <div className="flex gap-1 h-full">
          <div className="w-1/3 bg-secondary/50 p-1 rounded text-[5px]">
            <p className="font-bold text-[7px] text-foreground truncate">{resumeData.name},</p>
            <p className="text-muted-foreground text-[5px]">{resumeData.title}</p>
            <p className="font-semibold text-foreground mt-1">Contact</p>
            <p className="text-muted-foreground truncate">{resumeData.email}</p>
            <p className="font-semibold text-foreground mt-1">Skills</p>
            {allSkills.slice(0, 2).map((s, i) => (
              <p key={i} className="text-muted-foreground truncate">• {s}</p>
            ))}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">Experience</p>
            <p className="text-muted-foreground truncate">• {resumeData.experience[0]?.text.slice(0, 30)}...</p>
            <p className="font-semibold text-foreground mt-1">Education</p>
            <p className="text-muted-foreground truncate">{resumeData.education?.[0]?.degree}</p>
          </div>
        </div>
      </div>
    );
  }

  if (template === 'bold') {
    return (
      <div className="bg-card p-2 rounded border border-border text-[6px] leading-tight h-24 overflow-hidden">
        <div className="flex justify-between mb-1">
          <div>
            <p className="font-bold text-[8px] text-foreground">{resumeData.name},</p>
            <p className="font-bold text-[7px] text-foreground">{resumeData.title}</p>
          </div>
          <div className="text-right text-[5px] text-muted-foreground">
            <p>{resumeData.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <p className="text-[5px] text-muted-foreground italic truncate">{resumeData.summary?.slice(0, 40)}...</p>
            <p className="font-semibold text-foreground mt-1 border-b border-border">WORK EXPERIENCE</p>
            <p className="text-muted-foreground truncate">• {resumeData.experience[0]?.text.slice(0, 20)}...</p>
          </div>
          <div className="w-1/3">
            <p className="font-semibold text-foreground border-b border-border">SKILLS</p>
            {allSkills.slice(0, 3).map((s, i) => (
              <p key={i} className="text-muted-foreground truncate">{s}</p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Compact template
  return (
    <div className="bg-card p-2 rounded border border-border text-[6px] leading-tight h-24 overflow-hidden">
      <div className="flex gap-1 h-full">
        <div className="w-2/5">
          <p className="font-bold text-[8px] text-foreground truncate">{resumeData.name}</p>
          <p className="text-[5px] text-muted-foreground">{resumeData.title}</p>
          <p className="font-semibold text-foreground mt-1 border-b border-border text-[5px]">EDUCATION</p>
          <p className="text-muted-foreground truncate">{resumeData.education?.[0]?.degree}</p>
          <p className="font-semibold text-foreground mt-1 border-b border-border text-[5px]">CONTACT</p>
          <p className="text-muted-foreground truncate">{resumeData.email}</p>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground border-b border-border text-[5px]">WORK EXPERIENCE</p>
          <p className="text-muted-foreground truncate">• {resumeData.experience[0]?.text.slice(0, 25)}...</p>
          <p className="font-semibold text-foreground mt-1 border-b border-border text-[5px]">SKILLS</p>
          {allSkills.slice(0, 2).map((s, i) => (
            <p key={i} className="text-muted-foreground truncate">• {s}</p>
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
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('creative');

  const templates: TemplateOption[] = [
    {
      id: 'creative',
      name: 'Creative',
      description: 'Two-column with right sidebar for contact & skills',
      bestFor: 'Design, Tech, Startups',
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Header with contact, two-column body layout',
      bestFor: 'Corporate, Business, Finance',
    },
    {
      id: 'sidebar',
      name: 'Sidebar',
      description: 'Left sidebar with contact & skills, main content right',
      bestFor: 'Marketing, Creative, Consulting',
    },
    {
      id: 'bold',
      name: 'Bold',
      description: 'Summary focused with underlined section headers',
      bestFor: 'Leadership, Senior Roles, Executive',
    },
    {
      id: 'compact',
      name: 'Compact',
      description: 'Education first, clean two-column layout',
      bestFor: 'Academics, Research, Recent Grads',
    },
  ];

  const handleDownload = () => {
    onSelectTemplate(selectedTemplate);
    onOpenChange(false);
  };

  const newSkills = confirmedSkills.filter(
    skill => !originalSkills.some(os => os.toLowerCase() === skill.toLowerCase())
  );
  const allSkills = [...originalSkills, ...newSkills];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0">
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

        <ScrollArea className="flex-1 max-h-[65vh]">
          <div className="p-6">
            {/* Template Grid - 5 templates */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={cn(
                    "relative rounded-xl border-2 p-2 transition-all hover:border-primary/50 text-left",
                    selectedTemplate === template.id
                      ? "border-primary bg-primary/5 shadow-lg"
                      : "border-border bg-card hover:bg-secondary/50"
                  )}
                >
                  {selectedTemplate === template.id && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center z-10">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <TemplatePreview
                    template={template.id}
                    resumeData={resumeData}
                    confirmedSkills={confirmedSkills}
                    originalSkills={originalSkills}
                  />
                  <div className="mt-2">
                    <h3 className="font-semibold text-foreground text-xs">{template.name}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{template.description}</p>
                    <Badge variant="secondary" className="mt-1.5 text-[9px] px-1.5 py-0">
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
              <div className="bg-card border border-border rounded-lg p-6 max-w-3xl mx-auto shadow-lg">
                {selectedTemplate === 'creative' && (
                  <CreativeTemplatePreview
                    resumeData={resumeData}
                    confirmedSkills={confirmedSkills}
                    originalSkills={originalSkills}
                    allSkills={allSkills}
                    newSkills={newSkills}
                  />
                )}
                {selectedTemplate === 'professional' && (
                  <ProfessionalTemplatePreview
                    resumeData={resumeData}
                    confirmedSkills={confirmedSkills}
                    originalSkills={originalSkills}
                    allSkills={allSkills}
                    newSkills={newSkills}
                  />
                )}
                {selectedTemplate === 'sidebar' && (
                  <SidebarTemplatePreview
                    resumeData={resumeData}
                    confirmedSkills={confirmedSkills}
                    originalSkills={originalSkills}
                    allSkills={allSkills}
                    newSkills={newSkills}
                  />
                )}
                {selectedTemplate === 'bold' && (
                  <BoldTemplatePreview
                    resumeData={resumeData}
                    confirmedSkills={confirmedSkills}
                    originalSkills={originalSkills}
                    allSkills={allSkills}
                    newSkills={newSkills}
                  />
                )}
                {selectedTemplate === 'compact' && (
                  <CompactTemplatePreview
                    resumeData={resumeData}
                    confirmedSkills={confirmedSkills}
                    originalSkills={originalSkills}
                    allSkills={allSkills}
                    newSkills={newSkills}
                  />
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-4 border-t border-border bg-secondary/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            All templates are ATS-optimized for maximum compatibility
          </p>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <JoystickButton
              variant="neutral"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Cancel</span>
            </JoystickButton>
            <JoystickButton
              variant="accent"
              size="sm"
              onClick={handleDownload}
              className="flex-1 sm:flex-none"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download {templates.find(t => t.id === selectedTemplate)?.name}</span>
              <span className="sm:hidden">Download</span>
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
  allSkills: string[];
  newSkills: string[];
}

// Template 1: Creative - Two column with right sidebar
const CreativeTemplatePreview: React.FC<FullPreviewProps> = ({
  resumeData,
  allSkills,
  newSkills,
}) => {
  return (
    <div className="text-xs flex gap-6">
      {/* Left main content */}
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-foreground">{resumeData.name}</h1>
        <p className="text-muted-foreground mb-3">{resumeData.title}</p>
        
        {resumeData.summary && (
          <p className="text-muted-foreground italic mb-4 text-[11px]">{resumeData.summary}</p>
        )}

        <h2 className="text-sm font-bold text-foreground mb-2">Work Experience</h2>
        {resumeData.originalExperience?.slice(0, 2).map((exp, i) => (
          <div key={i} className="mb-3">
            <div className="flex items-baseline gap-1">
              <span className="font-semibold text-foreground">{exp.title}</span>
              <span className="text-foreground">@ {exp.company}</span>
            </div>
            {exp.date && <p className="text-[10px] text-muted-foreground uppercase">{exp.date}</p>}
            <ul className="mt-1 space-y-0.5">
              {exp.bullets.slice(0, 3).map((bullet, j) => (
                <li key={j} className="text-muted-foreground flex items-start gap-1">
                  <span>•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {resumeData.education && resumeData.education.length > 0 && (
          <>
            <h2 className="text-sm font-bold text-foreground mb-2 mt-4">Education</h2>
            {resumeData.education.map((edu, i) => (
              <div key={i} className="mb-2">
                <p className="font-semibold text-foreground">{edu.degree} @ {edu.school}</p>
                {edu.date && <p className="text-[10px] text-muted-foreground uppercase">{edu.date}</p>}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Right sidebar */}
      <div className="w-1/3 bg-secondary/50 p-4 rounded-lg">
        <h3 className="font-bold text-foreground mb-2">Contact</h3>
        {resumeData.website && <p className="text-muted-foreground text-[11px]">{resumeData.website}</p>}
        {resumeData.email && <p className="text-muted-foreground text-[11px]">{resumeData.email}</p>}
        {resumeData.phone && <p className="text-muted-foreground text-[11px] mb-3">{resumeData.phone}</p>}

        <h3 className="font-bold text-foreground mb-2 mt-3">Skills</h3>
        <ul className="space-y-0.5">
          {allSkills.map((skill, i) => (
            <li key={i} className={cn(
              "text-[11px]",
              newSkills.includes(skill) ? "text-accent font-medium" : "text-muted-foreground"
            )}>
              • {skill}{newSkills.includes(skill) && ' ✓'}
            </li>
          ))}
        </ul>

        {resumeData.tools && resumeData.tools.length > 0 && (
          <>
            <h3 className="font-bold text-foreground mb-2 mt-3">Tools</h3>
            <ul className="space-y-0.5">
              {resumeData.tools.map((tool, i) => (
                <li key={i} className="text-muted-foreground text-[11px]">• {tool}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

// Template 2: Professional - Header with contact right
const ProfessionalTemplatePreview: React.FC<FullPreviewProps> = ({
  resumeData,
  allSkills,
  newSkills,
}) => {
  return (
    <div className="text-xs">
      {/* Header */}
      <div className="flex justify-between items-start mb-4 pb-3 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{resumeData.name},</h1>
          <p className="text-lg font-bold text-foreground">{resumeData.title}</p>
        </div>
        <div className="text-right text-muted-foreground">
          {resumeData.website && <p>{resumeData.website}</p>}
          {resumeData.email && <p>{resumeData.email}</p>}
          {resumeData.phone && <p>{resumeData.phone}</p>}
        </div>
      </div>

      {/* Body */}
      <div className="flex gap-6">
        <div className="flex-1">
          <h2 className="text-sm font-bold text-foreground mb-2">Work Experience</h2>
          {resumeData.originalExperience?.slice(0, 2).map((exp, i) => (
            <div key={i} className="mb-3">
              <p><span className="font-semibold text-foreground">{exp.company}</span> <span className="text-muted-foreground">{exp.title}</span></p>
              {exp.date && <p className="text-[10px] text-muted-foreground uppercase">{exp.date}</p>}
              <ul className="mt-1 space-y-0.5">
                {exp.bullets.slice(0, 3).map((bullet, j) => (
                  <li key={j} className="text-muted-foreground">• {bullet}</li>
                ))}
              </ul>
            </div>
          ))}

          {resumeData.education && resumeData.education.length > 0 && (
            <>
              <h2 className="text-sm font-bold text-foreground mb-2 mt-4">Education</h2>
              {resumeData.education.map((edu, i) => (
                <div key={i} className="mb-2">
                  <p><span className="font-semibold text-foreground">{edu.school}</span> <span className="text-muted-foreground">{edu.degree}</span></p>
                  {edu.date && <p className="text-[10px] text-muted-foreground uppercase">{edu.date}</p>}
                </div>
              ))}
            </>
          )}
        </div>

        <div className="w-1/3">
          <h2 className="text-sm font-bold text-foreground mb-2">Skills</h2>
          <ul className="space-y-0.5">
            {allSkills.map((skill, i) => (
              <li key={i} className={cn(
                "text-[11px]",
                newSkills.includes(skill) ? "text-accent font-medium" : "text-muted-foreground"
              )}>
                • {skill}{newSkills.includes(skill) && ' ✓'}
              </li>
            ))}
          </ul>

          {resumeData.tools && resumeData.tools.length > 0 && (
            <>
              <h2 className="text-sm font-bold text-foreground mb-2 mt-4">Tools</h2>
              <ul className="space-y-0.5">
                {resumeData.tools.map((tool, i) => (
                  <li key={i} className="text-muted-foreground text-[11px]">• {tool}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Template 3: Sidebar - Left sidebar
const SidebarTemplatePreview: React.FC<FullPreviewProps> = ({
  resumeData,
  allSkills,
  newSkills,
}) => {
  return (
    <div className="text-xs flex gap-6">
      {/* Left sidebar */}
      <div className="w-1/3 bg-secondary/50 p-4 rounded-lg">
        <h1 className="text-lg font-bold text-foreground">{resumeData.name},</h1>
        <p className="text-foreground font-semibold mb-4">{resumeData.title}</p>

        <h3 className="font-bold text-foreground mb-2">Contact</h3>
        {resumeData.website && <p className="text-muted-foreground text-[11px]">{resumeData.website}</p>}
        {resumeData.email && <p className="text-muted-foreground text-[11px]">{resumeData.email}</p>}
        {resumeData.phone && <p className="text-muted-foreground text-[11px] mb-3">{resumeData.phone}</p>}

        <h3 className="font-bold text-foreground mb-2 mt-3">Skills</h3>
        <ul className="space-y-0.5">
          {allSkills.map((skill, i) => (
            <li key={i} className={cn(
              "text-[11px]",
              newSkills.includes(skill) ? "text-accent font-medium" : "text-muted-foreground"
            )}>
              • {skill}{newSkills.includes(skill) && ' ✓'}
            </li>
          ))}
        </ul>

        {resumeData.tools && resumeData.tools.length > 0 && (
          <>
            <h3 className="font-bold text-foreground mb-2 mt-3">Tools</h3>
            <ul className="space-y-0.5">
              {resumeData.tools.map((tool, i) => (
                <li key={i} className="text-muted-foreground text-[11px]">• {tool}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Right main content */}
      <div className="flex-1">
        <h2 className="text-sm font-bold text-foreground mb-2">Work Experience</h2>
        {resumeData.originalExperience?.slice(0, 2).map((exp, i) => (
          <div key={i} className="mb-3">
            <p><span className="font-semibold text-foreground">{exp.company}</span> <span className="text-muted-foreground">{exp.title}</span></p>
            {exp.date && <p className="text-[10px] text-muted-foreground uppercase">{exp.date}</p>}
            <ul className="mt-1 space-y-0.5">
              {exp.bullets.slice(0, 3).map((bullet, j) => (
                <li key={j} className="text-muted-foreground">• {bullet}</li>
              ))}
            </ul>
          </div>
        ))}

        {resumeData.education && resumeData.education.length > 0 && (
          <>
            <h2 className="text-sm font-bold text-foreground mb-2 mt-4">Education</h2>
            {resumeData.education.map((edu, i) => (
              <div key={i} className="mb-2">
                <p><span className="font-semibold text-foreground">{edu.school}</span> <span className="text-muted-foreground">{edu.degree}</span></p>
                {edu.date && <p className="text-[10px] text-muted-foreground uppercase">{edu.date}</p>}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

// Template 4: Bold - Summary with underlined headers
const BoldTemplatePreview: React.FC<FullPreviewProps> = ({
  resumeData,
  allSkills,
  newSkills,
}) => {
  return (
    <div className="text-xs">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{resumeData.name},</h1>
          <p className="text-lg font-bold text-foreground">{resumeData.title}</p>
        </div>
        <div className="text-right text-muted-foreground">
          {resumeData.website && <p>{resumeData.website}</p>}
          {resumeData.email && <p>{resumeData.email}</p>}
          {resumeData.phone && <p>{resumeData.phone}</p>}
        </div>
      </div>

      {/* Body */}
      <div className="flex gap-6">
        <div className="flex-1">
          {resumeData.summary && (
            <p className="font-semibold text-foreground mb-4">{resumeData.summary}</p>
          )}

          <h2 className="text-sm font-bold text-foreground mb-2 pb-1 border-b border-foreground">WORK EXPERIENCE</h2>
          {resumeData.originalExperience?.slice(0, 2).map((exp, i) => (
            <div key={i} className="mb-3">
              <p><span className="font-semibold text-foreground">{exp.company}</span> <span className="text-muted-foreground">{exp.title}</span></p>
              {exp.date && <p className="text-[10px] text-muted-foreground uppercase">{exp.date}</p>}
              <ul className="mt-1 space-y-0.5">
                {exp.bullets.slice(0, 3).map((bullet, j) => (
                  <li key={j} className="text-muted-foreground">• {bullet}</li>
                ))}
              </ul>
            </div>
          ))}

          {resumeData.education && resumeData.education.length > 0 && (
            <>
              <h2 className="text-sm font-bold text-foreground mb-2 mt-4 pb-1 border-b border-foreground">EDUCATION</h2>
              {resumeData.education.map((edu, i) => (
                <div key={i} className="mb-2">
                  <p><span className="font-semibold text-foreground">{edu.school}</span> <span className="text-muted-foreground">{edu.degree}</span></p>
                  {edu.date && <p className="text-[10px] text-muted-foreground uppercase">{edu.date}</p>}
                </div>
              ))}
            </>
          )}
        </div>

        <div className="w-1/3">
          <h2 className="text-sm font-bold text-foreground mb-2 pb-1 border-b border-foreground">SKILLS</h2>
          <ul className="space-y-0.5">
            {allSkills.map((skill, i) => (
              <li key={i} className={cn(
                "text-[11px]",
                newSkills.includes(skill) ? "text-accent font-medium" : "text-muted-foreground"
              )}>
                {skill}{newSkills.includes(skill) && ' ✓'}
              </li>
            ))}
          </ul>

          {resumeData.tools && resumeData.tools.length > 0 && (
            <>
              <h2 className="text-sm font-bold text-foreground mb-2 mt-4 pb-1 border-b border-foreground">TOOLS</h2>
              <ul className="space-y-0.5">
                {resumeData.tools.map((tool, i) => (
                  <li key={i} className="text-muted-foreground text-[11px]">{tool}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Template 5: Compact - Education first
const CompactTemplatePreview: React.FC<FullPreviewProps> = ({
  resumeData,
  allSkills,
  newSkills,
}) => {
  return (
    <div className="text-xs flex gap-6">
      {/* Left column */}
      <div className="w-2/5">
        <h1 className="text-2xl font-bold text-foreground">{resumeData.name}</h1>
        <p className="text-muted-foreground mb-4">{resumeData.title}</p>

        {resumeData.education && resumeData.education.length > 0 && (
          <>
            <h2 className="text-sm font-bold text-foreground mb-2 pb-1 border-b border-foreground">EDUCATION</h2>
            {resumeData.education.map((edu, i) => (
              <div key={i} className="mb-2">
                <p className="font-semibold text-foreground">{edu.degree} @ {edu.school}</p>
                {edu.date && <p className="text-[10px] text-muted-foreground uppercase">{edu.date}</p>}
              </div>
            ))}
          </>
        )}

        <h2 className="text-sm font-bold text-foreground mb-2 mt-4 pb-1 border-b border-foreground">CONTACT</h2>
        {resumeData.website && <p className="text-muted-foreground">Website: {resumeData.website}</p>}
        {resumeData.email && <p className="text-muted-foreground">Email: {resumeData.email}</p>}
        {resumeData.phone && <p className="text-muted-foreground">Phone: {resumeData.phone}</p>}
      </div>

      {/* Right column */}
      <div className="flex-1">
        <h2 className="text-sm font-bold text-foreground mb-2 pb-1 border-b border-foreground">WORK EXPERIENCE</h2>
        {resumeData.originalExperience?.slice(0, 2).map((exp, i) => (
          <div key={i} className="mb-3">
            <p className="font-semibold text-foreground">{exp.title} @ {exp.company}</p>
            {exp.date && <p className="text-[10px] text-muted-foreground uppercase">{exp.date}</p>}
            <ul className="mt-1 space-y-0.5">
              {exp.bullets.slice(0, 3).map((bullet, j) => (
                <li key={j} className="text-muted-foreground">• {bullet}</li>
              ))}
            </ul>
          </div>
        ))}

        <h2 className="text-sm font-bold text-foreground mb-2 mt-4 pb-1 border-b border-foreground">SKILLS</h2>
        <ul className="space-y-0.5">
          {allSkills.map((skill, i) => (
            <li key={i} className={cn(
              "text-[11px]",
              newSkills.includes(skill) ? "text-accent font-medium" : "text-muted-foreground"
            )}>
              • {skill}{newSkills.includes(skill) && ' ✓'}
            </li>
          ))}
        </ul>

        {resumeData.tools && resumeData.tools.length > 0 && (
          <>
            <h2 className="text-sm font-bold text-foreground mb-2 mt-4 pb-1 border-b border-foreground">TOOLS</h2>
            <ul className="space-y-0.5">
              {resumeData.tools.map((tool, i) => (
                <li key={i} className="text-muted-foreground text-[11px]">• {tool}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};
