import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BackgroundBlobs } from "@/components/BackgroundBlobs";
import { FileUploadZone } from "@/components/FileUploadZone";
import { JoystickButton, DialKnob } from "@/components/JoystickButton";
import { Sparkles, Zap, Shield, ArrowRight } from "lucide-react";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const handleInitialize = () => {
    if (jobDescription && resumeFile) {
      sessionStorage.setItem("jobDescription", jobDescription);
      sessionStorage.setItem("resumeFileName", resumeFile.name);
      navigate("/interrogation");
    }
  };

  const isReady = jobDescription.trim().length > 50 && resumeFile;

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <BackgroundBlobs variant="landing" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-4">
          <JoystickButton variant="primary" size="md">
            <Zap className="w-6 h-6" />
          </JoystickButton>
          <span className="text-2xl font-bold text-foreground">ResumeAI</span>
        </div>
        
        {/* Decorative dial */}
        <div className="hidden md:block">
          <DialKnob rotation={45} size="sm" />
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
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-foreground">
              Tailor your resume with{" "}
              <span className="text-gradient">verified accuracy</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Unlike other AI tools that hallucinate skills, we verify every change with you 
              before adding it. Your resume stays authentic, accurate, and powerful.
            </p>
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
              <Textarea
                placeholder="Paste the job description here... Include the role title, requirements, and key responsibilities."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[240px] rounded-2xl border-2 border-border bg-card shadow-sm focus:border-primary focus:ring-0 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {jobDescription.length} characters
                {jobDescription.length < 50 && " • Minimum 50 required"}
              </p>
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
              disabled={!isReady}
              className="group"
            >
              Initialize Analysis
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
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

          {/* Features */}
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
              <div
                key={i}
                className="bg-card/80 backdrop-blur-sm rounded-3xl p-8 text-center border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Joystick-style 3D button */}
                <div className="mx-auto mb-6 flex justify-center">
                  <JoystickButton variant={feature.variant} size="lg">
                    <feature.icon className="w-8 h-8" />
                  </JoystickButton>
                </div>
                <h3 className="font-bold text-foreground mb-3 text-xl">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
