import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackgroundBlobs } from "@/components/BackgroundBlobs";
import { JoystickButton } from "@/components/JoystickButton";
import { ControllerCard, JoystickController, MiniJoystick } from "@/components/JoystickElements";
import { Zap, Plus, FileText, Briefcase, Trash2, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useResumeSession } from "@/hooks/useResumeSession";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { getUserSessions } = useResumeSession();
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      loadSessions();
    }
  }, [user, authLoading]);

  const loadSessions = async () => {
    setIsLoading(true);
    const data = await getUserSessions();
    setSessions(data);
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const handleSessionClick = (session: any) => {
    // Navigate to editor with session data
    navigate("/editor", {
      state: {
        sessionId: session.id,
        jobDescription: {
          title: session.jd_title || "Job Position",
          company: session.jd_company || "Company",
          skills: session.jd_skills || [],
          requirements: session.jd_requirements || [],
          responsibilities: session.jd_responsibilities || [],
          rawText: session.job_description_text,
        },
        resume: {
          skills: session.resume_skills || [],
          experience: session.resume_experience || [],
          rawText: session.original_resume_text,
        },
        confirmedSkills: session.confirmed_skills || [],
        gapsIdentified: session.gaps_identified || [],
      },
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <BackgroundBlobs variant="landing" />

      {/* Decorative Controller */}
      <div className="absolute top-40 -right-32 opacity-10 rotate-[20deg] pointer-events-none hidden lg:block">
        <JoystickController />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-4">
          <JoystickButton variant="primary" size="md" onClick={() => navigate("/")}>
            <Zap className="w-6 h-6" />
          </JoystickButton>
          <span className="text-2xl font-bold text-foreground">My Resumes</span>
        </div>
        
        <div className="flex items-center gap-4">
          <JoystickButton variant="accent" size="md" onClick={() => navigate("/")}>
            <Plus className="w-5 h-5 mr-2" />
            <span className="hidden md:inline font-semibold">New Resume</span>
          </JoystickButton>
          <JoystickButton variant="neutral" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" />
          </JoystickButton>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 md:px-12 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <ControllerCard className="max-w-md mx-auto text-center py-12">
            <MiniJoystick variant="primary" className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-xl font-bold text-foreground mb-2">No resumes yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first tailored resume by uploading your resume and a job description.
            </p>
            <JoystickButton variant="primary" size="lg" onClick={() => navigate("/")}>
              <Plus className="w-5 h-5 mr-2" />
              Create Resume
            </JoystickButton>
          </ControllerCard>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <div 
                key={session.id}
                className="cursor-pointer"
                onClick={() => handleSessionClick(session)}
              >
                <ControllerCard 
                  className="hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
                >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <JoystickButton variant="primary" size="sm">
                      <Briefcase className="w-4 h-4" />
                    </JoystickButton>
                    <div>
                      <h3 className="font-bold text-foreground text-sm line-clamp-1">
                        {session.jd_title || "Job Position"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {session.jd_company || "Company"}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "px-2 py-1 rounded-md text-xs font-medium",
                    session.status === "completed" 
                      ? "bg-accent/10 text-accent" 
                      : "bg-primary/10 text-primary"
                  )}>
                    {session.status === "completed" ? "Complete" : "In Progress"}
                  </span>
                </div>

                {/* Skills Preview */}
                {session.jd_skills && session.jd_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {session.jd_skills.slice(0, 4).map((skill: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-md text-xs bg-secondary text-muted-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                    {session.jd_skills.length > 4 && (
                      <span className="px-2 py-1 rounded-md text-xs bg-secondary text-muted-foreground">
                        +{session.jd_skills.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Scores */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {session.new_ats_score && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground line-through">
                        {session.old_ats_score}%
                      </span>
                      <span className="text-sm font-bold text-accent">
                        {session.new_ats_score}%
                      </span>
                    </div>
                  )}
                </div>
                </ControllerCard>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
