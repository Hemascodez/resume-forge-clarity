import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BackgroundBlobs } from "@/components/BackgroundBlobs";
import { ATSScoreComparison, ChangesSummary } from "@/components/ATSScoreComparison";
import { EditableExperienceItem } from "@/components/EditableExperienceItem";
import { JoystickButton, DialKnob } from "@/components/JoystickButton";
import { ControllerCard, TriggerProgress, JoystickController, MiniJoystick } from "@/components/JoystickElements";
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
    <div className="min-h-screen relative overflow-hidden flex flex-col bg-background">
      <BackgroundBlobs variant="editor" />

      {/* Decorative Controllers */}
      <div className="absolute -bottom-20 -left-32 opacity-10 rotate-[-10deg] pointer-events-none hidden lg:block">
        <JoystickController />
      </div>

      {/* Compact Header with Controller Style */}
      <header className="relative z-10 flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <JoystickButton 
            variant="neutral" 
            size="sm" 
            onClick={() => navigate("/interrogation")}
          >
            <ArrowLeft className="w-4 h-4" />
          </JoystickButton>
          <div className="flex items-center gap-2">
            <JoystickButton variant="primary" size="sm">
              <Zap className="w-4 h-4" />
            </JoystickButton>
            <span className="font-bold text-foreground text-sm hidden md:inline">Final Review</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <DialKnob rotation={newScore * 3.6} size="sm" />
          </div>
          <ATSScoreComparison oldScore={oldScore} newScore={newScore} />
          <JoystickButton variant="accent" size="md" onClick={() => {}}>
            <Download className="w-5 h-5" />
          </JoystickButton>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-hidden">
        {/* Mobile Tabs */}
        <div className="md:hidden h-full">
          <Tabs defaultValue="resume" className="h-full flex flex-col">
            <TabsList className="mx-4 mt-3 bg-secondary rounded-xl h-10 p-1">
              <TabsTrigger value="changes" className="flex-1 rounded-lg text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Changes
              </TabsTrigger>
              <TabsTrigger value="resume" className="flex-1 rounded-lg text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Resume
              </TabsTrigger>
              <TabsTrigger value="jd" className="flex-1 rounded-lg text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                JD
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="changes" className="flex-1 p-4 overflow-y-auto">
              <ChangesPanel missing={missingSkills} added={addedSkills} oldScore={oldScore} newScore={newScore} />
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
        <div className="hidden md:grid md:grid-cols-12 h-full divide-x divide-border">
          {/* Left: Changes Summary (narrow) */}
          <div className="col-span-3 p-4 overflow-y-auto bg-card/50">
            <ChangesPanel missing={missingSkills} added={addedSkills} oldScore={oldScore} newScore={newScore} />
          </div>

          {/* Center: Resume (main focus) */}
          <div className="col-span-5 p-4 overflow-y-auto bg-background">
            <ResumePanel resume={mockResume} experience={experience} onUpdateExperience={handleUpdateExperience} />
          </div>

          {/* Right: JD Reference (narrow) */}
          <div className="col-span-4 p-4 overflow-y-auto bg-card/50">
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
  oldScore: number;
  newScore: number;
}

const ChangesPanel: React.FC<ChangesPanelProps> = ({ missing, added, oldScore, newScore }) => (
  <ControllerCard className="space-y-4">
    <div className="flex items-center gap-3 mb-4">
      <MiniJoystick variant="primary" className="w-10 h-10" />
      <h3 className="text-sm font-bold text-foreground">Score Boost</h3>
    </div>
    <TriggerProgress value={newScore} label={`${oldScore}% → ${newScore}%`} />
    <ChangesSummary missing={missing} added={added} />
    <p className="text-xs text-muted-foreground">
      Click any bullet point to edit manually.
    </p>
  </ControllerCard>
);

interface JDPanelProps {
  jd: typeof mockJD;
}

const JDPanel: React.FC<JDPanelProps> = ({ jd }) => (
  <ControllerCard className="space-y-4">
    <div className="flex items-center gap-3">
      <JoystickButton variant="neutral" size="sm">
        <Briefcase className="w-4 h-4" />
      </JoystickButton>
      <div>
        <h2 className="font-bold text-foreground text-sm">{jd.title}</h2>
        <p className="text-xs text-muted-foreground">{jd.company}</p>
      </div>
    </div>

    <div className="flex flex-wrap gap-1.5">
      {jd.skills.map((skill, i) => (
        <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
          {skill}
        </span>
      ))}
    </div>
  </ControllerCard>
);

interface ResumePanelProps {
  resume: typeof mockResume;
  experience: typeof initialExperience;
  onUpdateExperience: (index: number, text: string) => void;
}

const ResumePanel: React.FC<ResumePanelProps> = ({ resume, experience, onUpdateExperience }) => (
  <ControllerCard hasGlow className="space-y-5">
    {/* Header */}
    <div className="flex items-center gap-3">
      <JoystickButton variant="primary" size="lg">
        <FileText className="w-6 h-6" />
      </JoystickButton>
      <div>
        <h2 className="font-bold text-foreground text-lg">{resume.name}</h2>
        <p className="text-sm text-primary font-medium">{resume.title}</p>
      </div>
    </div>

    {/* Skills */}
    <div className="flex flex-wrap gap-1.5">
      {resume.skills.map((skill, i) => (
        <span
          key={i}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold border",
            mockJD.skills.includes(skill)
              ? "bg-accent/10 text-accent border-accent/20"
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
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Experience</h3>
        <span className="text-xs font-semibold text-accent">{experience.filter(e => e.isModified).length} enhanced</span>
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
  </ControllerCard>
);

export default EditorPage;
