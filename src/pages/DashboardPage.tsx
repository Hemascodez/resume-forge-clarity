import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BackgroundBlobs } from "@/components/BackgroundBlobs";
import { JoystickButton } from "@/components/JoystickButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, FileText, Building2, Calendar, ArrowRight, Plus, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface ResumeSession {
  id: string;
  jd_title: string | null;
  jd_company: string | null;
  created_at: string;
  updated_at: string;
  status: string;
  old_ats_score: number | null;
  new_ats_score: number | null;
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ResumeSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("resume_sessions")
        .select("id, jd_title, jd_company, created_at, updated_at, status, old_ats_score, new_ats_score")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load your resumes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("resume_sessions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setSessions(prev => prev.filter(s => s.id !== id));
      toast.success("Resume deleted");
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete resume");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <BackgroundBlobs variant="landing" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 sm:py-6">
        <div className="flex items-center gap-3 sm:gap-4 cursor-pointer" onClick={() => navigate("/")}>
          <JoystickButton variant="primary" size="sm">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
          </JoystickButton>
          <span className="text-xl sm:text-2xl font-bold text-foreground">ResumeAI</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">My Resumes</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Your tailored resumes and applications</p>
            </div>
            <Button onClick={() => navigate("/")} className="gap-2 self-start sm:self-auto">
              <Plus className="w-4 h-4" />
              <span>New Resume</span>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : sessions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No resumes yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Start by uploading your resume and a job description to create your first tailored resume.
                </p>
                <Button onClick={() => navigate("/")} className="gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Create Your First Resume</span>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <Card
                  key={session.id}
                  className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30 group"
                  onClick={() => {
                    // TODO: Navigate to view/edit saved session
                    toast.info("Resume view coming soon!");
                  }}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                          <h3 className="font-semibold text-foreground truncate text-sm sm:text-base">
                            {session.jd_title || "Untitled Position"}
                          </h3>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            <Building2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="truncate max-w-[120px] sm:max-w-none">{session.jd_company || "Unknown Company"}</span>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{format(new Date(session.created_at), "MMM d, yyyy")}</span>
                          </div>
                          {session.new_ats_score && (
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                                ATS: {session.new_ats_score}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleDelete(session.id, e)}
                          disabled={deletingId === session.id}
                        >
                          {deletingId === session.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
