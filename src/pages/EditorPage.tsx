import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BackgroundBlobs } from "@/components/BackgroundBlobs";
import { MatchScoreGauge } from "@/components/MatchScoreGauge";
import { HighlightedText, ModifiedBullet } from "@/components/HighlightedText";
import { ArrowLeft, Download, FileText, Briefcase, Zap, Eye, EyeOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const mockJD = {
  title: "Senior Frontend Engineer",
  company: "TechCorp Inc.",
  skills: ["React", "TypeScript", "GraphQL", "React Native", "CI/CD", "Team Leadership"],
  description: `We are looking for a Senior Frontend Engineer to join our growing team. You will be responsible for building and maintaining our customer-facing applications using modern web technologies.

Requirements:
• 5+ years of experience with React and TypeScript
• Experience with GraphQL and REST APIs
• Familiarity with React Native for mobile development
• Strong understanding of CI/CD pipelines
• Experience leading or mentoring junior developers
• Excellent problem-solving and communication skills`,
};

const mockResume = {
  name: "Alex Johnson",
  title: "Senior Frontend Developer",
  experience: [
    {
      text: "Led development of customer-facing React applications using TypeScript and modern best practices",
      isModified: true,
    },
    {
      text: "Implemented GraphQL APIs and optimized data fetching patterns for improved performance",
      isModified: true,
    },
    {
      text: "Built cross-platform mobile features using React Native",
      isModified: true,
    },
    {
      text: "Established and maintained CI/CD pipelines using GitHub Actions and AWS",
      isModified: true,
    },
    {
      text: "Mentored 3 junior developers and led code review processes",
      isModified: true,
    },
    {
      text: "Collaborated with UX/UI designers to implement pixel-perfect designs",
      isModified: false,
    },
    {
      text: "Reduced application bundle size by 40% through code splitting and lazy loading",
      isModified: false,
    },
  ],
  skills: ["React", "TypeScript", "JavaScript", "GraphQL", "React Native", "Node.js", "AWS", "CI/CD", "Git"],
};

const EditorPage: React.FC = () => {
  const navigate = useNavigate();
  const [showModifications, setShowModifications] = useState(true);
  const matchScore = 92;

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      <BackgroundBlobs variant="editor" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 md:px-6 py-4 border-b border-border/30 glass">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/interrogation")}
            className="rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground hidden md:inline">Final Review</span>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <MatchScoreGauge score={matchScore} className="scale-75 md:scale-100" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowModifications(!showModifications)}
            className="hidden md:flex rounded-xl"
          >
            {showModifications ? (
              <><EyeOff className="w-4 h-4 mr-2" /> Hide Changes</>
            ) : (
              <><Eye className="w-4 h-4 mr-2" /> Show Changes</>
            )}
          </Button>
          
          <Button variant="hero" size="default" className="gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Download PDF</span>
          </Button>
        </div>
      </header>

      {/* Main Content - Split View on Desktop, Tabs on Mobile */}
      <main className="relative z-10 flex-1 overflow-hidden">
        {/* Mobile Tabs View */}
        <div className="md:hidden h-full">
          <Tabs defaultValue="resume" className="h-full flex flex-col">
            <TabsList className="mx-4 mt-4 glass rounded-xl">
              <TabsTrigger value="jd" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Briefcase className="w-4 h-4 mr-2" />
                Job Description
              </TabsTrigger>
              <TabsTrigger value="resume" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileText className="w-4 h-4 mr-2" />
                Your Resume
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="jd" className="flex-1 p-4 overflow-y-auto">
              <JDPanel jd={mockJD} />
            </TabsContent>
            
            <TabsContent value="resume" className="flex-1 p-4 overflow-y-auto">
              <ResumePanel 
                resume={mockResume} 
                showModifications={showModifications} 
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop Split View */}
        <div className="hidden md:grid md:grid-cols-2 h-full divide-x divide-border/30">
          {/* Left Panel - Job Description */}
          <div className="p-6 overflow-y-auto">
            <JDPanel jd={mockJD} />
          </div>

          {/* Right Panel - Resume */}
          <div className="p-6 overflow-y-auto bg-card/20">
            <ResumePanel 
              resume={mockResume} 
              showModifications={showModifications} 
            />
          </div>
        </div>
      </main>
    </div>
  );
};

interface JDPanelProps {
  jd: typeof mockJD;
}

const JDPanel: React.FC<JDPanelProps> = ({ jd }) => (
  <div className="glass-strong rounded-2xl p-6 space-y-6">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
        <Briefcase className="w-6 h-6 text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">{jd.title}</h2>
        <p className="text-muted-foreground">{jd.company}</p>
      </div>
    </div>

    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
        Key Skills Required
      </h3>
      <div className="flex flex-wrap gap-2">
        {jd.skills.map((skill, i) => (
          <span
            key={i}
            className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>

    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
        Full Description
      </h3>
      <div className="text-foreground text-sm leading-relaxed whitespace-pre-line">
        <HighlightedText text={jd.description} highlights={jd.skills} />
      </div>
    </div>
  </div>
);

interface ResumePanelProps {
  resume: typeof mockResume;
  showModifications: boolean;
}

const ResumePanel: React.FC<ResumePanelProps> = ({ resume, showModifications }) => (
  <div className="glass-strong rounded-2xl p-6 space-y-6 bg-card/40">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0 glow-cyan">
        <FileText className="w-6 h-6 text-primary-foreground" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">{resume.name}</h2>
        <p className="text-primary">{resume.title}</p>
      </div>
    </div>

    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
        Skills
      </h3>
      <div className="flex flex-wrap gap-2">
        {resume.skills.map((skill, i) => (
          <span
            key={i}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium border",
              mockJD.skills.includes(skill)
                ? "bg-neon-lime/10 text-neon-lime border-neon-lime/30"
                : "bg-secondary text-foreground border-border"
            )}
          >
            {skill}
            {mockJD.skills.includes(skill) && " ✓"}
          </span>
        ))}
      </div>
    </div>

    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Experience Highlights
        </h3>
        {showModifications && (
          <span className="text-xs text-primary">
            {resume.experience.filter(e => e.isModified).length} items enhanced
          </span>
        )}
      </div>
      <ul className="space-y-1 text-sm text-foreground">
        {resume.experience.map((item, i) => (
          <ModifiedBullet
            key={i}
            text={item.text}
            isModified={showModifications && item.isModified}
          />
        ))}
      </ul>
    </div>

    {showModifications && (
      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4 border-t border-border/30">
        <div className="w-3 h-3 rounded bg-primary/20 border-l-2 border-l-primary" />
        <span>Highlighted items were verified and enhanced during our conversation</span>
      </div>
    )}
  </div>
);

export default EditorPage;
