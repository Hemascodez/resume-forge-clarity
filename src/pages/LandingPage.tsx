import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { BackgroundBlobs } from "@/components/BackgroundBlobs";
import { FileUploadZone } from "@/components/FileUploadZone";
import { JoystickButton, DialKnob, DPad } from "@/components/JoystickButton";
import { JoystickController, MiniJoystick, ControllerCard } from "@/components/JoystickElements";
import { Sparkles, Zap, Shield, ArrowRight, Loader2, Link, FileText, ClipboardPaste } from "lucide-react";
import { toast } from "sonner";
import { storeOriginalFile } from "@/lib/resumeEditor";
import { supabase } from "@/integrations/supabase/client";

// Simple JD parser - extracts structured data from job description text
const parseJobDescription = (text: string) => {
  const lines = text.split('\n').filter(line => line.trim());
  
  // Try to extract title from first meaningful line
  const title = lines[0]?.replace(/^(job title:|position:|role:)/i, '').trim() || 'Job Position';
  
  // Try to extract company name
  const companyMatch = text.match(/(?:company|organization|employer):\s*([^\n]+)/i);
  const company = companyMatch?.[1]?.trim() || 'Company';
  
  // Extract skills - look for common patterns
  const skillPatterns = [
    /(?:skills?|technologies|tech stack|requirements?):\s*([^\n]+)/gi,
    /(?:experience with|proficiency in|knowledge of)\s+([^,.]+)/gi,
  ];
  
  const skills: string[] = [];
  const requirements: string[] = [];
  const responsibilities: string[] = [];
  
  // Extract bullet points as requirements or responsibilities
  lines.forEach(line => {
    const cleanLine = line.replace(/^[-•*]\s*/, '').trim();
    if (cleanLine.length > 10) {
      if (cleanLine.toLowerCase().includes('experience') || 
          cleanLine.toLowerCase().includes('required') ||
          cleanLine.toLowerCase().includes('must have') ||
          cleanLine.toLowerCase().includes('years')) {
        requirements.push(cleanLine);
      } else if (cleanLine.toLowerCase().includes('will') ||
                 cleanLine.toLowerCase().includes('responsible') ||
                 cleanLine.toLowerCase().includes('manage') ||
                 cleanLine.toLowerCase().includes('develop')) {
        responsibilities.push(cleanLine);
      }
    }
  });
  
  // Extract technology/skill keywords
  const techKeywords = text.match(/\b(React|Angular|Vue|Node\.?js|Python|Java|JavaScript|TypeScript|SQL|PostgreSQL|MongoDB|AWS|Azure|GCP|Docker|Kubernetes|GraphQL|REST|API|Git|CI\/CD|Agile|Scrum|Machine Learning|AI|Data Science|Redux|Next\.?js|Express|Django|Flask|Spring|Ruby|Rails|PHP|Laravel|Swift|Kotlin|Flutter|React Native|HTML|CSS|SASS|Tailwind|Bootstrap|Figma|Sketch|UI\/UX|DevOps|Linux|Terraform|Jenkins|Ansible)\b/gi);
  
  if (techKeywords) {
    const uniqueSkills = [...new Set(techKeywords.map(s => s.toLowerCase()))];
    skills.push(...uniqueSkills);
  }
  
  return {
    title,
    company,
    skills: skills.slice(0, 15), // Limit to 15 skills
    requirements: requirements.slice(0, 10),
    responsibilities: responsibilities.slice(0, 10),
    rawText: text,
  };
};

// Resume parser - uses edge function for PDF/DOCX, falls back to text parsing
const parseResume = async (file: File): Promise<{
  skills: string[];
  experience: { title: string; company: string; bullets: string[] }[];
  rawText: string;
  name: string;
  title: string;
}> => {
  // For PDF and DOCX files, use the edge function
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf') || 
      file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-resume`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: formData,
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to parse resume');
    }
    
    const data = await response.json();
    
    return {
      skills: data.skills || [],
      experience: data.experience || [],
      rawText: data.text || '',
      name: data.name || 'Your Name',
      title: data.title || 'Professional',
    };
  }
  
  // For text files, parse directly
  const text = await file.text();
  
  const skills: string[] = [];
  const experience: { title: string; company: string; bullets: string[] }[] = [];
  let candidateName = '';
  let candidateTitle = '';
  
  // Extract name from first few lines
  const lines = text.split('\n').filter(l => l.trim());
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i].trim();
    const nameMatch = line.match(/^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})$/);
    if (nameMatch && !candidateName) {
      candidateName = nameMatch[1];
      continue;
    }
    const titleKeywords = ['developer', 'designer', 'engineer', 'manager', 'lead', 'director', 'analyst', 'consultant', 'specialist', 'architect'];
    if (!candidateTitle && line.length > 5 && line.length < 60) {
      const lowerLine = line.toLowerCase();
      if (titleKeywords.some(k => lowerLine.includes(k))) {
        candidateTitle = line;
      }
    }
  }
  
  // Extract skills
  const techKeywords = text.match(/\b(React|Angular|Vue|Node\.?js|Python|Java|JavaScript|TypeScript|SQL|PostgreSQL|MongoDB|AWS|Azure|GCP|Docker|Kubernetes|GraphQL|REST|API|Git|CI\/CD|Agile|Scrum|Machine Learning|AI|Data Science|Redux|Next\.?js|Express|Django|Flask|Spring|Ruby|Rails|PHP|Laravel|Swift|Kotlin|Flutter|React Native|HTML|CSS|SASS|Tailwind|Bootstrap|Figma|Sketch|UI\/UX|DevOps|Linux|Terraform|Jenkins|Ansible|Product Design|User Research|Prototyping|Wireframing|Design Systems|Adobe XD|Framer)\b/gi);
  if (techKeywords) {
    skills.push(...[...new Set(techKeywords.map(s => s.toLowerCase()))]);
  }
  
  // Extract experience bullets
  const bullets: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if ((trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) && trimmed.length > 20) {
      bullets.push(trimmed.replace(/^[-•*]\s*/, '').slice(0, 500));
    }
  }
  
  if (bullets.length > 0 || skills.length > 0) {
    experience.push({
      title: candidateTitle || 'Professional Experience',
      company: 'Various',
      bullets: bullets.slice(0, 10),
    });
  }
  
  return {
    skills,
    experience,
    rawText: text.slice(0, 50000),
    name: candidateName || 'Your Name',
    title: candidateTitle || 'Professional',
  };
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [inputMode, setInputMode] = useState<"paste" | "url">("paste");
  const [isFetchingJD, setIsFetchingJD] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Extract URL from pasted text (LinkedIn mobile app pastes "Check out this job at Company: URL")
  const extractUrlFromText = (text: string): string | null => {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const matches = text.match(urlRegex);
    return matches ? matches[0] : null;
  };

  const handleJobUrlChange = (value: string) => {
    // Try to extract URL if the pasted text contains extra content
    const extractedUrl = extractUrlFromText(value);
    if (extractedUrl && value !== extractedUrl) {
      setJobUrl(extractedUrl);
      toast.success("URL extracted from pasted text!");
    } else {
      setJobUrl(value);
    }
  };

  const fetchJobFromUrl = async () => {
    if (!jobUrl.trim()) return;
    
    // Validate it's a proper URL
    const urlToFetch = extractUrlFromText(jobUrl);
    if (!urlToFetch) {
      toast.error("Please enter a valid job posting URL");
      return;
    }
    
    setIsFetchingJD(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-job-description', {
        body: { url: urlToFetch }
      });
      
      if (error) throw error;
      
      if (data?.jobDescription) {
        setJobDescription(data.jobDescription);
        setInputMode("paste");
        toast.success("Job description fetched successfully!");
      } else {
        throw new Error("Could not extract job description");
      }
    } catch (error) {
      console.error("Error fetching JD:", error);
      toast.error("Failed to fetch job description. Please paste it manually.");
    } finally {
      setIsFetchingJD(false);
    }
  };

  const handleInitialize = async () => {
    if (!jobDescription || !resumeFile) return;
    
    setIsProcessing(true);
    
    try {
      // Parse both inputs
      const parsedJD = parseJobDescription(jobDescription);
      const parsedResume = await parseResume(resumeFile);
      
      // Store original file for later modification
      storeOriginalFile(resumeFile, parsedResume.rawText);
      
      // Navigate with parsed data
      navigate("/interrogation", {
        state: {
          jobDescription: parsedJD,
          resume: parsedResume,
          originalFileName: resumeFile.name,
        },
      });
    } catch (error) {
      console.error("Error parsing files:", error);
      toast.error("Error processing your files. Please try again.");
      setIsProcessing(false);
    }
  };

  const isReady = jobDescription.trim().length > 50 && resumeFile;

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <BackgroundBlobs variant="landing" />

      {/* Decorative Controller Elements */}
      <div className="absolute top-20 -left-20 opacity-20 rotate-[-15deg] pointer-events-none">
        <JoystickController />
      </div>
      <div className="absolute bottom-20 -right-20 opacity-15 rotate-[15deg] pointer-events-none hidden lg:block">
        <JoystickController />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-4">
          <JoystickButton variant="primary" size="md">
            <Zap className="w-6 h-6" />
          </JoystickButton>
          <span className="text-2xl font-bold text-foreground">ResumeAI</span>
        </div>
        
        {/* Dashboard link */}
        <div className="flex items-center gap-4">
          <JoystickButton variant="accent" size="md" onClick={() => navigate("/dashboard")}>
            <span className="text-sm font-semibold">My Resumes</span>
          </JoystickButton>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-6 md:px-12 py-8 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Text */}
          <div className="text-center mb-12 md:mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">
                Human-in-the-Loop AI Verification
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-scribble font-bold mb-8 leading-tight text-foreground">
              Finally, an AI That Doesn't Lie on Your Resume
            </h1>
            
            <div className="font-poppins text-base md:text-lg text-muted-foreground max-w-2xl mx-auto space-y-4">
              <p>
                Most AI tools hallucinate harder than your ex's excuses — adding random skills you never learned.
              </p>
              <p className="font-medium text-foreground">
                We don't do that.
              </p>
              <p>
                Every update goes through you first. Because accuracy beats chaos every time.
              </p>
              <p>
                Your resume stays sharp, credible, and recruiter-ready.<br />
                <span className="font-medium text-foreground">No surprises. No cringe.</span>
              </p>
            </div>
          </div>

          {/* Input Zones */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            {/* Job Description Zone */}
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
                  style={{
                    background: "linear-gradient(135deg, hsl(211 100% 50%), hsl(211 100% 60%))",
                    boxShadow: "0 4px 12px hsl(211 100% 50% / 0.2)"
                  }}
                >
                  <span className="text-sm text-primary-foreground font-bold">1</span>
                </div>
                Target Job Description
              </label>
              
              {/* Toggle between paste and URL */}
              <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl">
                <button
                  type="button"
                  onClick={() => setInputMode("paste")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    inputMode === "paste"
                      ? "bg-card shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Paste JD
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("url")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    inputMode === "url"
                      ? "bg-card shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Link className="w-4 h-4" />
                  Job URL
                </button>
              </div>

              {inputMode === "paste" ? (
                <>
                  <Textarea
                    placeholder="Paste the job description here... Include the role title, requirements, and key responsibilities."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-[200px] rounded-2xl border-2 border-border bg-card shadow-sm focus:border-primary focus:ring-0 resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {jobDescription.length} characters
                    {jobDescription.length < 50 && " • Minimum 50 required"}
                  </p>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Paste LinkedIn job link or any job posting URL"
                      value={jobUrl}
                      onChange={(e) => handleJobUrlChange(e.target.value)}
                      className="rounded-xl flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0 rounded-xl"
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          handleJobUrlChange(text);
                        } catch (err) {
                          toast.error("Could not access clipboard. Please paste manually.");
                        }
                      }}
                    >
                      <ClipboardPaste className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    onClick={fetchJobFromUrl}
                    disabled={!jobUrl.trim() || isFetchingJD}
                    className="w-full"
                    variant="secondary"
                  >
                    {isFetchingJD ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Fetching Job Description...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Fetch Job Description
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    AI will extract the job description from the URL
                  </p>
                  {jobDescription && (
                    <div className="p-3 bg-accent/10 rounded-xl border border-accent/20">
                      <p className="text-xs text-accent font-medium mb-1">✓ Job description fetched</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{jobDescription.slice(0, 150)}...</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Resume Upload Zone */}
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
                  style={{
                    background: "linear-gradient(135deg, hsl(142 76% 45%), hsl(142 76% 55%))",
                    boxShadow: "0 4px 12px hsl(142 76% 45% / 0.2)"
                  }}
                >
                  <span className="text-sm text-accent-foreground font-bold">2</span>
                </div>
                Your Current Resume
              </label>
              <FileUploadZone
                onFileSelect={setResumeFile}
                className="min-h-[240px]"
              />
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button
              variant="hero"
              size="xl"
              onClick={handleInitialize}
              disabled={!isReady || isProcessing}
              className="group"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Initialize Analysis
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
            
            {!isReady && (
              <p className="text-sm text-muted-foreground mt-4">
                {!jobDescription.trim() && !resumeFile
                  ? "Paste a job description and upload your resume to begin"
                  : !jobDescription.trim() || jobDescription.length < 50
                  ? "Add a more detailed job description"
                  : "Upload your resume to continue"}
              </p>
            )}
          </div>

          {/* Features with Controller Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16 md:mt-24 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            {[
              {
                icon: Shield,
                title: "No Hallucinations",
                description: "Every skill addition is verified with you first. No fake credentials.",
                variant: "primary" as const
              },
              {
                icon: Sparkles,
                title: "Smart Gap Analysis",
                description: "AI identifies missing skills and asks clarifying questions.",
                variant: "accent" as const
              },
              {
                icon: Zap,
                title: "Instant Polish",
                description: "Get a perfectly tailored resume in minutes, not hours.",
                variant: "neutral" as const
              },
            ].map((feature, i) => (
              <ControllerCard
                key={i}
                hasGlow={feature.variant === "primary"}
                className="text-center hover:-translate-y-2 transition-all duration-300"
              >
                {/* Joystick-style 3D button */}
                <div className="mx-auto mb-6 flex justify-center">
                  <JoystickButton variant={feature.variant} size="lg">
                    <feature.icon className="w-8 h-8" />
                  </JoystickButton>
                </div>
                <h3 className="font-bold text-foreground mb-3 text-xl">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </ControllerCard>
            ))}
          </div>

          {/* Decorative D-Pad */}
          <div className="hidden lg:flex justify-center mt-16 opacity-30">
            <DPad />
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
