import React from "react";

interface BackgroundBlobsProps {
  variant?: "landing" | "chat" | "editor";
}

export const BackgroundBlobs: React.FC<BackgroundBlobsProps> = ({ variant = "landing" }) => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Clean gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-background to-accent/[0.02]" />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      
      {/* Subtle dot pattern at intersections */}
      <div 
        className="absolute inset-0 opacity-[0.3]"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--primary) / 0.3) 1.5px, transparent 1.5px)`,
          backgroundSize: '60px 60px',
        }}
      />
      
      {/* Decorative gradient orbs */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/[0.06] blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-accent/[0.06] blur-3xl" />
      
      {variant === "chat" && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-3xl" />
      )}
      
      {variant === "editor" && (
        <>
          <div className="absolute top-20 right-20 w-[300px] h-[300px] rounded-full bg-accent/[0.05] blur-3xl" />
          <div className="absolute bottom-20 left-20 w-[250px] h-[250px] rounded-full bg-primary/[0.05] blur-3xl" />
        </>
      )}
    </div>
  );
};