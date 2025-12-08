import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BackgroundBlobs } from "@/components/BackgroundBlobs";
import { ATSScoreComparison, ChangesSummary } from "@/components/ATSScoreComparison";
import { EditableExperienceItem } from "@/components/EditableExperienceItem";
import { JoystickButton, DialKnob } from "@/components/JoystickButton";
import { ControllerCard, TriggerProgress, JoystickController, MiniJoystick } from "@/components/JoystickElements";
import { ArrowLeft, Download, FileText, Briefcase, Zap, Loader2, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { downloadModifiedResume, ResumeModifications } from "@/lib/resumeEditor";
import { ResumePreviewModal } from "@/components/ResumePreviewModal";
import { useATSScore } from "@/hooks/useATSScore";
import { toast } from "sonner";

interface LocationState {
  sessionId?: string;
  jobDescription?: {
    title: string;
    company: string;
    skills: string[];
    requirements: string[];
    responsibilities: string[];
    rawText?: string;
  };
  resume?: {
    skills: string[];
    experience: {
      title: string;
      company: string;
      bullets: string[];
    }[];
    rawText?: string;
    name?: string;
    title?: string;
  };
  gapsIdentified?: string[];
  confirmedSkills?: string[];
  summary?: string;
}

// Fallback mock data for direct navigation
const fallbackJD = {
  title: "Senior Frontend Engineer",
  company: "TechCorp Inc.",
  location: "San Francisco, CA (Hybrid)",
  type: "Full-time",
  salary: "$150,000 - $200,000",
  skills: ["React", "TypeScript", "GraphQL", "React Native", "CI/CD", "Team Leadership"],
  description: "We are looking for a Senior Frontend Engineer to join our growing team.",
  responsibilities: [
    "Lead the development of customer-facing React applications",
    "Architect scalable frontend solutions using TypeScript and GraphQL",
    "Build and maintain cross-platform mobile features with React Native",
  ],
  requirements: [
    "5+ years of experience with React and TypeScript",
    "Strong understanding of GraphQL and REST APIs",
    "Experience with React Native for mobile development",
  ],
};

const fallbackResume = {
  name: "Alex Johnson",
  title: "Senior Frontend Developer",
  skills: ["React", "TypeScript", "JavaScript", "Node.js", "AWS", "Git"],
  experience: [
    { title: "Senior Frontend Developer", company: "Tech Co", bullets: ["Built React applications", "Led team projects"] }
  ],
};

const EditorPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  
  const { calculateScore, isCalculating, oldScore, newScore, missingSkills, matchedSkills } = useATSScore();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Use data from interrogation flow or fallback
  const jd = locationState?.jobDescription ? {
    ...fallbackJD,
    ...locationState.jobDescription,
  } : fallbackJD;
  
  const resumeData = locationState?.resume || fallbackResume;
  const confirmedSkills = locationState?.confirmedSkills || [];
  
  // Build initial experience from resume data or confirmed skills
  const buildInitialExperience = () => {
    if (locationState?.resume?.experience?.[0]?.bullets) {
      return locationState.resume.experience[0].bullets.map((bullet, idx) => ({
        text: bullet,
        isModified: idx < confirmedSkills.length, // Mark first N as modified based on confirmed skills
      }));
    }
    // Generate experience bullets from confirmed skills
    return confirmedSkills.length > 0 ? confirmedSkills.map(skill => ({
      text: `Demonstrated expertise in ${skill} through hands-on project work`,
      isModified: true,
    })) : [
      { text: "Led development of customer-facing applications", isModified: false },
      { text: "Collaborated with cross-functional teams", isModified: false },
    ];
  };
  
  const [experience, setExperience] = useState(buildInitialExperience);
  
  // Calculate ATS score on mount
  useEffect(() => {
    if (locationState?.jobDescription && locationState?.resume) {
      calculateScore(
        locationState.jobDescription,
        locationState.resume,
        confirmedSkills,
        experience
      );
    }
  }, []);

  const handleUpdateExperience = (index: number, newText: string) => {
    const updated = experience.map((item, i) => 
      i === index ? { ...item, text: newText, isModified: true } : item
    );
    setExperience(updated);
    
    // Recalculate score with updated experience
    if (locationState?.jobDescription && locationState?.resume) {
      calculateScore(
        locationState.jobDescription,
        locationState.resume,
        confirmedSkills,
        updated
      );
    }
  };

  // Track original experience for modifications
  const originalExperience = locationState?.resume?.experience?.[0]?.bullets || [];
  
  const handleDownload = async () => {
    // Build modifications object
    const modifications: ResumeModifications = {
      originalSkills: locationState?.resume?.skills || [],
      confirmedSkills: confirmedSkills,
      experienceChanges: experience.map((exp, idx) => ({
        original: originalExperience[idx] || '',
        modified: exp.text,
      })).filter(change => change.original !== change.modified),
      jobTitle: jd.title,
      company: jd.company,
    };
    
    try {
      // Download modified resume (preserves original format)
      await downloadModifiedResume(modifications, locationState?.resume?.name || 'Resume');
      toast.success("Resume downloaded successfully!");
    } catch (error) {
      console.error("Error downloading resume:", error);
      toast.error("Error downloading resume. Please try again.");
    }
  };

  const displayOldScore = oldScore || 45;
  const displayNewScore = newScore || 45;
  const displayMissing = missingSkills.length > 0 ? missingSkills : jd.skills.slice(0, 3);
  const displayAdded = matchedSkills.length > 0 ? matchedSkills : confirmedSkills;

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col bg-background">
      <BackgroundBlobs variant="editor" />

      <div className="absolute -bottom-20 -left-32 opacity-10 rotate-[-10deg] pointer-events-none hidden lg:block">
        <JoystickController />
      </div>

      <header className="relative z-10 flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <JoystickButton 
            variant="primary" 
            size="sm" 
            onClick={() => navigate("/")}
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
          {isCalculating ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden md:inline">Calculating...</span>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <DialKnob rotation={displayNewScore * 3.6} size="sm" />
              </div>
              <ATSScoreComparison oldScore={displayOldScore} newScore={displayNewScore} />
            </>
          )}
          
          <JoystickButton variant="neutral" size="md" onClick={() => setShowPreviewModal(true)}>
            <Eye className="w-4 h-4 mr-2" />
            <span className="font-semibold text-sm hidden md:inline">Preview</span>
          </JoystickButton>
          
          <JoystickButton variant="accent" size="md" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            <span className="font-semibold text-sm">Download</span>
          </JoystickButton>
        </div>
      </header>
      
      <ResumePreviewModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
        onDownload={handleDownload}
        resumeData={{
          name: locationState?.resume?.name || 'Your Name',
          title: locationState?.resume?.title || 'Professional',
          skills: resumeData.skills,
          experience,
        }}
        jobTitle={jd.title}
        company={jd.company}
        confirmedSkills={confirmedSkills}
        originalSkills={locationState?.resume?.skills || []}
      />

      <main className="relative z-10 flex-1 overflow-hidden">
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
              <ChangesPanel 
                missing={displayMissing} 
                added={displayAdded} 
                oldScore={displayOldScore} 
                newScore={displayNewScore}
                isCalculating={isCalculating}
              />
            </TabsContent>
            <TabsContent value="jd" className="flex-1 p-4 overflow-y-auto">
              <JDPanel jd={jd} matchedSkills={matchedSkills} />
            </TabsContent>
            <TabsContent value="resume" className="flex-1 p-4 overflow-y-auto">
              <ResumePanel 
                resume={{ name: locationState?.resume?.name || 'Your Name', title: locationState?.resume?.title || 'Professional', skills: resumeData.skills }}
                experience={experience} 
                onUpdateExperience={handleUpdateExperience}
                jdSkills={jd.skills}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="hidden md:grid md:grid-cols-12 h-full divide-x divide-border">
          <div className="col-span-3 p-4 overflow-y-auto bg-card/50">
            <ChangesPanel 
              missing={displayMissing} 
              added={displayAdded} 
              oldScore={displayOldScore} 
              newScore={displayNewScore}
              isCalculating={isCalculating}
            />
          </div>

          <div className="col-span-5 p-4 overflow-y-auto bg-background">
            <ResumePanel 
              resume={{ name: locationState?.resume?.name || 'Your Name', title: locationState?.resume?.title || 'Professional', skills: resumeData.skills }}
              experience={experience} 
              onUpdateExperience={handleUpdateExperience}
              jdSkills={jd.skills}
            />
          </div>

          <div className="col-span-4 p-4 overflow-y-auto bg-card/50">
            <JDPanel jd={jd} matchedSkills={matchedSkills} />
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
  isCalculating?: boolean;
}

const ChangesPanel: React.FC<ChangesPanelProps> = ({ missing, added, oldScore, newScore, isCalculating }) => (
  <ControllerCard className="space-y-4">
    <div className="flex items-center gap-3 mb-4">
      <MiniJoystick variant="primary" className="w-10 h-10" />
      <h3 className="text-sm font-bold text-foreground">Score Boost</h3>
    </div>
    {isCalculating ? (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    ) : (
      <TriggerProgress value={newScore} label={`${oldScore}% → ${newScore}%`} />
    )}
    <ChangesSummary missing={missing} added={added} />
    <p className="text-xs text-muted-foreground">
      Click any bullet point to edit manually.
    </p>
  </ControllerCard>
);

interface JDPanelProps {
  jd: typeof fallbackJD;
  matchedSkills?: string[];
}

const JDPanel: React.FC<JDPanelProps> = ({ jd, matchedSkills = [] }) => (
  <ControllerCard className="space-y-4">
    <div className="flex items-center gap-3">
      <JoystickButton variant="primary" size="sm">
        <Briefcase className="w-4 h-4" />
      </JoystickButton>
      <div>
        <h2 className="font-bold text-foreground text-sm">{jd.title}</h2>
        <p className="text-xs text-muted-foreground">{jd.company}</p>
      </div>
    </div>

    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
      <span className="px-2 py-1 bg-secondary rounded-md">{jd.location}</span>
      <span className="px-2 py-1 bg-secondary rounded-md">{jd.type}</span>
      <span className="px-2 py-1 bg-accent/10 text-accent rounded-md font-medium">{jd.salary}</span>
    </div>

    <p className="text-xs text-foreground leading-relaxed">{jd.description}</p>

    <div>
      <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">Key Skills</h4>
      <div className="flex flex-wrap gap-1.5">
        {jd.skills.map((skill, i) => {
          const isMatched = matchedSkills.some(m => 
            m.toLowerCase() === skill.toLowerCase()
          );
          return (
            <span 
              key={i} 
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border",
                isMatched 
                  ? "bg-accent/10 text-accent border-accent/20"
                  : "bg-primary/10 text-primary border-primary/20"
              )}
            >
              {skill}
              {isMatched && " ✓"}
            </span>
          );
        })}
      </div>
    </div>

    <div>
      <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">Responsibilities</h4>
      <ul className="space-y-1.5">
        {jd.responsibilities.map((item, i) => (
          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>

    <div>
      <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">Requirements</h4>
      <ul className="space-y-1.5">
        {jd.requirements.map((item, i) => (
          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  </ControllerCard>
);

interface ResumePanelProps {
  resume: { name: string; title: string; skills: string[] };
  experience: { text: string; isModified: boolean }[];
  onUpdateExperience: (index: number, text: string) => void;
  jdSkills: string[];
}

const ResumePanel: React.FC<ResumePanelProps> = ({ resume, experience, onUpdateExperience, jdSkills }) => (
  <ControllerCard hasGlow className="space-y-5">
    <div className="flex items-center gap-3">
      <JoystickButton variant="primary" size="lg">
        <FileText className="w-6 h-6" />
      </JoystickButton>
      <div>
        <h2 className="font-bold text-foreground text-lg">{resume.name}</h2>
        <p className="text-sm text-primary font-medium">{resume.title}</p>
      </div>
    </div>

    <div className="flex flex-wrap gap-1.5">
      {resume.skills.map((skill, i) => (
        <span
          key={i}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold border",
            jdSkills.some(jdSkill => 
              jdSkill.toLowerCase() === skill.toLowerCase()
            )
              ? "bg-accent/10 text-accent border-accent/20"
              : "bg-secondary text-muted-foreground border-border"
          )}
        >
          {skill}
        </span>
      ))}
    </div>

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