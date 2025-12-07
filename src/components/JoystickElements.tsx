import React from "react";
import { cn } from "@/lib/utils";

// Large decorative joystick controller for backgrounds
export const JoystickController: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("relative", className)}>
      {/* Main controller body */}
      <div className="relative w-72 h-44 rounded-[3rem] bg-gradient-to-b from-card via-secondary to-muted border-4 border-border shadow-[0_20px_60px_hsl(var(--border)/0.4),inset_0_2px_4px_rgba(255,255,255,0.4)]">
        {/* Left analog stick area */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2">
          <div className="w-16 h-16 rounded-full bg-gradient-to-b from-muted to-secondary border-2 border-border shadow-[inset_0_4px_8px_rgba(0,0,0,0.2)]">
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary/80 to-primary shadow-[0_4px_12px_hsl(var(--primary)/0.4),inset_0_-2px_4px_hsl(var(--primary)/0.3)]">
              {/* Grip texture */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-primary-foreground/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Right buttons - ABXY style */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2">
          <div className="relative w-20 h-20">
            {/* Top button */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-gradient-to-b from-accent to-accent/70 shadow-[0_4px_8px_hsl(var(--accent)/0.3),inset_0_-2px_4px_hsl(var(--accent)/0.4)] border border-accent/50" />
            {/* Bottom button */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-gradient-to-b from-primary to-primary/70 shadow-[0_4px_8px_hsl(var(--primary)/0.3),inset_0_-2px_4px_hsl(var(--primary)/0.4)] border border-primary/50" />
            {/* Left button */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-7 h-7 rounded-full bg-gradient-to-b from-destructive to-destructive/70 shadow-[0_4px_8px_hsl(var(--destructive)/0.3),inset_0_-2px_4px_hsl(var(--destructive)/0.4)] border border-destructive/50" />
            {/* Right button */}
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-7 h-7 rounded-full bg-gradient-to-b from-chart-4 to-chart-4/70 shadow-[0_4px_8px_hsl(var(--chart-4)/0.3),inset_0_-2px_4px_hsl(var(--chart-4)/0.4)] border border-chart-4/50" />
          </div>
        </div>

        {/* Center logo area */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-b from-muted to-secondary border-2 border-border shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center">
              <span className="text-xs font-bold text-primary">AI</span>
            </div>
          </div>
        </div>

        {/* Top bumpers */}
        <div className="absolute -top-2 left-12 w-16 h-4 rounded-t-xl bg-gradient-to-b from-secondary to-muted border-2 border-border border-b-0 shadow-[0_-2px_8px_hsl(var(--border)/0.3)]" />
        <div className="absolute -top-2 right-12 w-16 h-4 rounded-t-xl bg-gradient-to-b from-secondary to-muted border-2 border-border border-b-0 shadow-[0_-2px_8px_hsl(var(--border)/0.3)]" />
      </div>
    </div>
  );
};

// Mini joystick decoration
export const MiniJoystick: React.FC<{ className?: string; variant?: "primary" | "accent" }> = ({ 
  className, 
  variant = "primary" 
}) => {
  const colors = variant === "primary" 
    ? "from-primary to-primary/70" 
    : "from-accent to-accent/70";
  const shadow = variant === "primary"
    ? "shadow-[0_4px_12px_hsl(var(--primary)/0.3)]"
    : "shadow-[0_4px_12px_hsl(var(--accent)/0.3)]";

  return (
    <div className={cn("relative w-12 h-12", className)}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-muted to-secondary border-2 border-border shadow-[inset_0_4px_8px_rgba(0,0,0,0.15)]">
        <div className={cn(
          "absolute inset-1.5 rounded-full bg-gradient-to-b border border-white/20",
          colors,
          shadow
        )}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white/30" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Progress bar styled like controller triggers
export const TriggerProgress: React.FC<{ value: number; label?: string; className?: string }> = ({ 
  value, 
  label,
  className 
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      {label && <span className="text-xs font-semibold text-muted-foreground">{label}</span>}
      <div className="relative h-4 rounded-full bg-gradient-to-b from-muted to-secondary border border-border shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
        <div 
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-accent shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
          style={{ width: `${value}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full" />
        </div>
      </div>
    </div>
  );
};

// Button group styled like controller face buttons
export const ControllerButtonGroup: React.FC<{
  buttons: { label: string; onClick: () => void; variant?: "primary" | "accent" | "neutral" }[];
  className?: string;
}> = ({ buttons, className }) => {
  const getColors = (variant: string = "neutral") => {
    switch (variant) {
      case "primary":
        return {
          bg: "from-primary to-primary/70",
          shadow: "shadow-[0_6px_16px_hsl(var(--primary)/0.3),inset_0_-3px_6px_hsl(var(--primary)/0.3)]",
          text: "text-primary-foreground"
        };
      case "accent":
        return {
          bg: "from-accent to-accent/70",
          shadow: "shadow-[0_6px_16px_hsl(var(--accent)/0.3),inset_0_-3px_6px_hsl(var(--accent)/0.3)]",
          text: "text-accent-foreground"
        };
      default:
        return {
          bg: "from-secondary to-muted",
          shadow: "shadow-[0_6px_16px_hsl(var(--border)/0.3),inset_0_-3px_6px_hsl(var(--border))]",
          text: "text-foreground"
        };
    }
  };

  return (
    <div className={cn("flex gap-3", className)}>
      {buttons.map((btn, i) => {
        const colors = getColors(btn.variant);
        return (
          <button
            key={i}
            onClick={btn.onClick}
            className={cn(
              "relative group rounded-full transition-all duration-200",
              "active:scale-95 hover:scale-105"
            )}
          >
            {/* Outer ring */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-b from-muted/50 to-transparent border border-border/50 p-1">
              {/* Inner button */}
              <div className={cn(
                "w-full h-full rounded-full bg-gradient-to-b flex items-center justify-center font-bold text-xs",
                colors.bg,
                colors.shadow,
                colors.text
              )}>
                {btn.label}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

// Card with controller aesthetic
export const ControllerCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  hasGlow?: boolean;
}> = ({ children, className, hasGlow = false }) => {
  return (
    <div className={cn(
      "relative rounded-3xl bg-gradient-to-b from-card to-secondary/30 border-2 border-border p-6",
      "shadow-[0_10px_40px_hsl(var(--border)/0.2),inset_0_1px_2px_rgba(255,255,255,0.3)]",
      hasGlow && "shadow-[0_10px_40px_hsl(var(--primary)/0.15),inset_0_1px_2px_rgba(255,255,255,0.3)]",
      className
    )}>
      {/* Top highlight */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      {children}
    </div>
  );
};

// Input styled like controller touchpad
export const ControllerInput: React.FC<{
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}> = ({ placeholder, value, onChange, className }) => {
  return (
    <div className={cn(
      "relative rounded-2xl bg-gradient-to-b from-muted to-secondary border-2 border-border p-1",
      "shadow-[inset_0_4px_12px_rgba(0,0,0,0.08)]",
      className
    )}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
};
