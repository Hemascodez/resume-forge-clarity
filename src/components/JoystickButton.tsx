import React from "react";
import { cn } from "@/lib/utils";

interface JoystickButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "accent" | "neutral";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const JoystickButton: React.FC<JoystickButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  className,
  onClick,
  disabled = false
}) => {
  const sizeClasses = {
    sm: "min-w-10 h-10 text-xs",
    md: "min-w-14 h-14 px-5 text-sm",
    lg: "min-w-20 h-20 px-6 text-base"
  };

  const variantStyles = {
    primary: {
      outer: "from-primary/20 to-primary/5",
      inner: "from-primary to-primary/80",
      shadow: "shadow-[inset_0_-4px_8px_hsl(var(--primary)/0.3),0_8px_16px_hsl(var(--primary)/0.2)]",
      glow: "group-hover:shadow-[inset_0_-4px_8px_hsl(var(--primary)/0.4),0_12px_24px_hsl(var(--primary)/0.3)]"
    },
    accent: {
      outer: "from-accent/20 to-accent/5",
      inner: "from-accent to-accent/80",
      shadow: "shadow-[inset_0_-4px_8px_hsl(var(--accent)/0.3),0_8px_16px_hsl(var(--accent)/0.2)]",
      glow: "group-hover:shadow-[inset_0_-4px_8px_hsl(var(--accent)/0.4),0_12px_24px_hsl(var(--accent)/0.3)]"
    },
    neutral: {
      outer: "from-muted to-muted/50",
      inner: "from-secondary to-secondary/80",
      shadow: "shadow-[inset_0_-4px_8px_hsl(var(--border)),0_8px_16px_hsl(var(--border)/0.3)]",
      glow: "group-hover:shadow-[inset_0_-4px_8px_hsl(var(--border)),0_12px_24px_hsl(var(--border)/0.4)]"
    }
  };

  const style = variantStyles[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative rounded-full transition-all duration-200",
        "active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        sizeClasses[size],
        className
      )}
    >
      {/* Outer ring - 3D base effect */}
      <div className={cn(
        "absolute inset-0 rounded-full bg-gradient-to-b border border-border/50",
        style.outer
      )} />
      
      {/* Inner button with 3D effect */}
      <div className={cn(
        "absolute inset-1.5 rounded-full bg-gradient-to-b flex items-center justify-center font-bold text-primary-foreground transition-all duration-200 whitespace-nowrap px-3",
        style.inner,
        style.shadow,
        style.glow
      )}>
        {children}
      </div>
    </button>
  );
};

// D-Pad style component
interface DPadProps {
  className?: string;
}

export const DPad: React.FC<DPadProps> = ({ className }) => {
  return (
    <div className={cn("relative w-32 h-32", className)}>
      {/* Center hub */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-b from-muted to-secondary border border-border shadow-inner" />
      
      {/* Up */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-12 rounded-t-xl bg-gradient-to-b from-secondary to-muted border border-border shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),0_4px_8px_hsl(var(--border)/0.3)]" />
      
      {/* Down */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-12 rounded-b-xl bg-gradient-to-t from-secondary to-muted border border-border shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1),0_4px_8px_hsl(var(--border)/0.3)]" />
      
      {/* Left */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-10 rounded-l-xl bg-gradient-to-r from-secondary to-muted border border-border shadow-[inset_2px_0_4px_rgba(255,255,255,0.3),0_4px_8px_hsl(var(--border)/0.3)]" />
      
      {/* Right */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-10 rounded-r-xl bg-gradient-to-l from-secondary to-muted border border-border shadow-[inset_-2px_0_4px_rgba(0,0,0,0.1),0_4px_8px_hsl(var(--border)/0.3)]" />
    </div>
  );
};

// Slider/Fader component
interface SliderKnobProps {
  value?: number;
  className?: string;
}

export const SliderKnob: React.FC<SliderKnobProps> = ({ value = 50, className }) => {
  return (
    <div className={cn("relative w-6 h-32 rounded-full bg-gradient-to-b from-muted to-secondary border border-border", className)}>
      {/* Track */}
      <div className="absolute inset-1 rounded-full bg-gradient-to-b from-border/50 to-transparent" />
      
      {/* Knob */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 w-5 h-8 rounded-lg bg-gradient-to-b from-card to-secondary border border-border shadow-[0_4px_12px_hsl(var(--border)/0.4)]"
        style={{ top: `${100 - value}%`, transform: `translate(-50%, -50%)` }}
      >
        {/* Grip lines */}
        <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 space-y-0.5">
          <div className="h-px bg-border" />
          <div className="h-px bg-border" />
          <div className="h-px bg-border" />
        </div>
      </div>
    </div>
  );
};

// Dial/Knob component
interface DialKnobProps {
  rotation?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const DialKnob: React.FC<DialKnobProps> = ({ rotation = 0, size = "md", className }) => {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24"
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {/* Outer ring with markers */}
      <div className="absolute inset-0 rounded-full border-4 border-border bg-gradient-to-b from-muted to-secondary" />
      
      {/* Inner dial */}
      <div 
        className="absolute inset-2 rounded-full bg-gradient-to-br from-card via-secondary to-muted border border-border shadow-[inset_0_2px_8px_rgba(0,0,0,0.1),0_4px_12px_hsl(var(--border)/0.3)]"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {/* Indicator notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-3 rounded-full bg-primary" />
      </div>
    </div>
  );
};