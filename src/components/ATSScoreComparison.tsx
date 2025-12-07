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
    <div className={cn("flex items-center gap-6", className)}>
      {/* Old Score */}
      <div className="text-center">
        <div className="text-2xl font-bold text-muted-foreground">{oldScore}%</div>
        <div className="text-xs text-muted-foreground">Before</div>
      </div>

      {/* Arrow with improvement */}
      <div className="flex flex-col items-center gap-1">
        <TrendingUp className="w-5 h-5 text-neon-lime" />
        <span className="text-sm font-bold text-neon-lime">+{improvement}%</span>
      </div>

      {/* New Score */}
      <div className="text-center">
        <div className="text-2xl font-bold text-gradient">{newScore}%</div>
        <div className="text-xs text-primary">After</div>
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
    <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="w-4 h-4 text-destructive" />
        <span className="text-xs font-medium text-destructive">Was Missing</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {missing.map((item, i) => (
          <span key={i} className="text-xs px-2 py-1 rounded-md bg-destructive/10 text-muted-foreground">
            {item}
          </span>
        ))}
      </div>
    </div>

    {/* What was added */}
    <div className="p-3 rounded-xl bg-neon-lime/5 border border-neon-lime/20">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle2 className="w-4 h-4 text-neon-lime" />
        <span className="text-xs font-medium text-neon-lime">Now Added</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {added.map((item, i) => (
          <span key={i} className="text-xs px-2 py-1 rounded-md bg-neon-lime/10 text-neon-lime">
            {item}
          </span>
        ))}
      </div>
    </div>
  </div>
);
