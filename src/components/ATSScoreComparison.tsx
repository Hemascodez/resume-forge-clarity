import React from "react";
import { TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ATSScoreComparisonProps {
  oldScore: number;
  newScore: number;
  className?: string;
}

export const ATSScoreComparison: React.FC<ATSScoreComparisonProps> = ({
  oldScore,
  newScore,
  className,
}) => {
  const improvement = newScore - oldScore;

  return (
    <div className={cn("flex items-center gap-6 p-4 rounded-2xl bg-card border border-border shadow-md", className)}>
      {/* Old Score */}
      <div className="text-center">
        <div className="text-2xl font-bold text-muted-foreground">{oldScore}%</div>
        <div className="text-xs text-muted-foreground font-medium">Before</div>
      </div>

      {/* Arrow with improvement */}
      <div 
        className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl"
        style={{
          background: "linear-gradient(135deg, hsl(142 76% 45% / 0.1), hsl(142 76% 45% / 0.05))"
        }}
      >
        <TrendingUp className="w-5 h-5 text-accent" />
        <span className="text-sm font-bold text-accent">+{improvement}%</span>
      </div>

      {/* New Score */}
      <div className="text-center">
        <div className="text-2xl font-bold text-gradient">{newScore}%</div>
        <div className="text-xs text-primary font-medium">After</div>
      </div>
    </div>
  );
};

interface ChangesSummaryProps {
  missing: string[];
  added: string[];
}

export const ChangesSummary: React.FC<ChangesSummaryProps> = ({ missing, added }) => (
  <div className="grid grid-cols-2 gap-3">
    {/* What was missing */}
    <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-4 h-4 text-destructive" />
        </div>
        <span className="text-sm font-semibold text-destructive">Was Missing</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {missing.map((item, i) => (
          <span key={i} className="text-xs px-2.5 py-1.5 rounded-lg bg-destructive/10 text-foreground font-medium">
            {item}
          </span>
        ))}
      </div>
    </div>

    {/* What was added */}
    <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-accent" />
        </div>
        <span className="text-sm font-semibold text-accent">Now Added</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {added.map((item, i) => (
          <span key={i} className="text-xs px-2.5 py-1.5 rounded-lg bg-accent/10 text-accent font-medium">
            {item}
          </span>
        ))}
      </div>
    </div>
  </div>
);
