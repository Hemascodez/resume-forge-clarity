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
    <div className={cn("flex items-center gap-2 md:gap-4 p-2 md:p-4 rounded-xl md:rounded-2xl bg-card border border-border shadow-md", className)}>
      {/* Old Score */}
      <div className="text-center">
        <div className="text-base md:text-2xl font-bold text-muted-foreground">{oldScore}%</div>
        <div className="text-[10px] md:text-xs text-muted-foreground font-medium hidden md:block">Before</div>
      </div>

      {/* Arrow with improvement */}
      <div 
        className="flex flex-col items-center gap-0.5 px-2 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl"
        style={{
          background: "linear-gradient(135deg, hsl(142 76% 45% / 0.1), hsl(142 76% 45% / 0.05))"
        }}
      >
        <TrendingUp className="w-3 h-3 md:w-5 md:h-5 text-accent" />
        <span className="text-[10px] md:text-sm font-bold text-accent">+{improvement}%</span>
      </div>

      {/* New Score */}
      <div className="text-center">
        <div className="text-base md:text-2xl font-bold text-gradient">{newScore}%</div>
        <div className="text-[10px] md:text-xs text-primary font-medium hidden md:block">After</div>
      </div>
    </div>
  );
};

interface ChangesSummaryProps {
  missing: string[];
  added: string[];
}

export const ChangesSummary: React.FC<ChangesSummaryProps> = ({ missing, added }) => (
  <div className="grid grid-cols-2 gap-2 md:gap-3">
    {/* What was missing */}
    <div className="p-3 md:p-4 rounded-xl bg-destructive/5 border border-destructive/20 shadow-sm min-w-0">
      <div className="flex items-center gap-2 mb-2 md:mb-3">
        <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
          <AlertCircle className="w-3 h-3 md:w-4 md:h-4 text-destructive" />
        </div>
        <span className="text-xs md:text-sm font-semibold text-destructive truncate">Was Missing</span>
      </div>
      <div className="flex flex-wrap gap-1 md:gap-1.5">
        {missing.map((item, i) => (
          <span key={i} className="text-[10px] md:text-xs px-2 py-1 md:px-2.5 md:py-1.5 rounded-lg bg-destructive/10 text-foreground font-medium break-all">
            {item}
          </span>
        ))}
      </div>
    </div>

    {/* What was added */}
    <div className="p-3 md:p-4 rounded-xl bg-accent/5 border border-accent/20 shadow-sm min-w-0">
      <div className="flex items-center gap-2 mb-2 md:mb-3">
        <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-accent" />
        </div>
        <span className="text-xs md:text-sm font-semibold text-accent truncate">Now Added</span>
      </div>
      <div className="flex flex-wrap gap-1 md:gap-1.5">
        {added.map((item, i) => (
          <span key={i} className="text-[10px] md:text-xs px-2 py-1 md:px-2.5 md:py-1.5 rounded-lg bg-accent/10 text-accent font-medium break-all">
            {item}
          </span>
        ))}
      </div>
    </div>
  </div>
);
