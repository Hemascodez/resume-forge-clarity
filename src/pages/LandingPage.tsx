import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BackgroundBlobs } from "@/components/BackgroundBlobs";
import { FileUploadZone } from "@/components/FileUploadZone";
import { Sparkles, Zap, Shield, ArrowRight } from "lucide-react";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const handleInitialize = () => {
    if (jobDescription && resumeFile) {
      // Store data and navigate to chat
      sessionStorage.setItem("jobDescription", jobDescription);
      sessionStorage.setItem("resumeFileName", resumeFile.name);
      navigate("/interrogation");
    }
  };

  const isReady = jobDescription.trim().length > 50 && resumeFile;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <BackgroundBlobs variant="landing" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center glow-cyan">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">ResumeAI</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-6 md:px-12 py-8 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Text */}
          <div className="text-center mb-12 md:mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 mb-6">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm text-muted-foreground">
                Human-in-the-Loop AI Verification
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
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
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                  <span className="text-xs text-primary font-bold">1</span>
                </div>
                Target Job Description
              </label>
              <Textarea
                placeholder="Paste the job description here... Include the role title, requirements, and key responsibilities."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[240px]"
              />
              <p className="text-xs text-muted-foreground">
                {jobDescription.length} characters
                {jobDescription.length < 50 && " • Minimum 50 required"}
              </p>
            </div>

            {/* Resume Upload Zone */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <div className="w-6 h-6 rounded-lg bg-accent/20 flex items-center justify-center">
                  <span className="text-xs text-accent font-bold">2</span>
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
              },
              {
                icon: Sparkles,
                title: "Smart Gap Analysis",
                description: "AI identifies missing skills and asks clarifying questions.",
              },
              {
                icon: Zap,
                title: "Instant Polish",
                description: "Get a perfectly tailored resume in minutes, not hours.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-6 text-center hover:bg-card/60 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-primary mx-auto mb-4 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
