import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BackgroundBlobs } from "@/components/BackgroundBlobs";
import { ATSScoreComparison, ChangesSummary } from "@/components/ATSScoreComparison";
import { EditableExperienceItem } from "@/components/EditableExperienceItem";
import { ArrowLeft, Download, FileText, Briefcase, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const mockJD = {
  title: "Senior Frontend Engineer",
  company: "TechCorp Inc.",
  skills: ["React", "TypeScript", "GraphQL", "React Native", "CI/CD", "Team Leadership"],
};

const initialExperience = [
  { text: "Led development of customer-facing React applications using TypeScript", isModified: true },
  { text: "Implemented GraphQL APIs and optimized data fetching patterns", isModified: true },
  { text: "Built cross-platform mobile features using React Native", isModified: true },
  { text: "Established CI/CD pipelines using GitHub Actions and AWS", isModified: true },
  { text: "Mentored 3 junior developers and led code review processes", isModified: true },
  { text: "Collaborated with UX/UI designers to implement pixel-perfect designs", isModified: false },
  { text: "Reduced application bundle size by 40% through code splitting", isModified: false },
];

const mockResume = {
  name: "Alex Johnson",
  title: "Senior Frontend Developer",
  skills: ["React", "TypeScript", "JavaScript", "GraphQL", "React Native", "Node.js", "AWS", "CI/CD", "Git"],
};

const EditorPage: React.FC = () => {
  const navigate = useNavigate();
  const [experience, setExperience] = useState(initialExperience);
  
  const oldScore = 58;
  const newScore = 92;
  const missingSkills = ["React Native", "GraphQL", "CI/CD", "Team Leadership"];
  const addedSkills = ["React Native", "GraphQL", "CI/CD", "Leadership"];

  const handleUpdateExperience = (index: number, newText: string) => {
    setExperience(prev => prev.map((item, i) => 
      i === index ? { ...item, text: newText } : item
    ));
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      <BackgroundBlobs variant="editor" />

      {/* Compact Header */}
      <header className="relative z-10 flex items-center justify-between px-4 md:px-6 py-3 border-b border-border/30 glass">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/interrogation")} className="rounded-xl h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground text-sm hidden md:inline">Final Review</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ATSScoreComparison oldScore={oldScore} newScore={newScore} />
          <Button variant="hero" size="default" className="gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Download</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-hidden">
        {/* Mobile Tabs */}
        <div className="md:hidden h-full">
          <Tabs defaultValue="resume" className="h-full flex flex-col">
            <TabsList className="mx-4 mt-3 glass rounded-xl h-10">
              <TabsTrigger value="changes" className="flex-1 rounded-lg text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Changes
              </TabsTrigger>
              <TabsTrigger value="resume" className="flex-1 rounded-lg text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Resume
              </TabsTrigger>
              <TabsTrigger value="jd" className="flex-1 rounded-lg text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                JD
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="changes" className="flex-1 p-4 overflow-y-auto">
              <ChangesPanel missing={missingSkills} added={addedSkills} />
            </TabsContent>
            <TabsContent value="jd" className="flex-1 p-4 overflow-y-auto">
              <JDPanel jd={mockJD} />
            </TabsContent>
            <TabsContent value="resume" className="flex-1 p-4 overflow-y-auto">
              <ResumePanel resume={mockResume} experience={experience} onUpdateExperience={handleUpdateExperience} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop: 3-Column Layout */}
        <div className="hidden md:grid md:grid-cols-12 h-full divide-x divide-border/30">
          {/* Left: Changes Summary (narrow) */}
          <div className="col-span-3 p-4 overflow-y-auto">
            <ChangesPanel missing={missingSkills} added={addedSkills} />
          </div>

          {/* Center: Resume (main focus) */}
          <div className="col-span-5 p-4 overflow-y-auto bg-card/20">
            <ResumePanel resume={mockResume} experience={experience} onUpdateExperience={handleUpdateExperience} />
          </div>

          {/* Right: JD Reference (narrow) */}
          <div className="col-span-4 p-4 overflow-y-auto">
            <JDPanel jd={mockJD} />
          </div>
        </div>
      </main>
    </div>
  );
};

interface ChangesPanelProps {
  missing: string[];
  added: string[];
}

const ChangesPanel: React.FC<ChangesPanelProps> = ({ missing, added }) => (
  <div className="space-y-4">
    <h3 className="text-sm font-semibold text-foreground">What Changed</h3>
    <ChangesSummary missing={missing} added={added} />
    <p className="text-xs text-muted-foreground">
      Click any bullet point in your resume to edit it manually.
    </p>
  </div>
);

interface JDPanelProps {
  jd: typeof mockJD;
}

const JDPanel: React.FC<JDPanelProps> = ({ jd }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
        <Briefcase className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <h2 className="font-semibold text-foreground text-sm">{jd.title}</h2>
        <p className="text-xs text-muted-foreground">{jd.company}</p>
      </div>
    </div>

    <div className="flex flex-wrap gap-1.5">
      {jd.skills.map((skill, i) => (
        <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
          {skill}
        </span>
      ))}
    </div>
  </div>
);

interface ResumePanelProps {
  resume: typeof mockResume;
  experience: typeof initialExperience;
  onUpdateExperience: (index: number, text: string) => void;
}

const ResumePanel: React.FC<ResumePanelProps> = ({ resume, experience, onUpdateExperience }) => (
  <div className="space-y-5">
    {/* Header */}
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0 glow-cyan">
        <FileText className="w-5 h-5 text-primary-foreground" />
      </div>
      <div>
        <h2 className="font-bold text-foreground">{resume.name}</h2>
        <p className="text-sm text-primary">{resume.title}</p>
      </div>
    </div>

    {/* Skills */}
    <div className="flex flex-wrap gap-1.5">
      {resume.skills.map((skill, i) => (
        <span
          key={i}
          className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium border",
            mockJD.skills.includes(skill)
              ? "bg-neon-lime/10 text-neon-lime border-neon-lime/30"
              : "bg-secondary text-muted-foreground border-border"
          )}
        >
          {skill}
        </span>
      ))}
    </div>

    {/* Experience - Editable */}
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Experience</h3>
        <span className="text-xs text-primary">{experience.filter(e => e.isModified).length} enhanced</span>
      </div>
      <div className="space-y-1">
        {experience.map((item, i) => (
          <EditableExperienceItem
            key={i}
            text={item.text}
            isModified={item.isModified}
            onSave={(newText) => onUpdateExperience(i, newText)}
          />
        ))}
      </div>
    </div>
  </div>
);

export default EditorPage;
