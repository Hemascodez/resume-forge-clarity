import React from "react";

interface BackgroundBlobsProps {
  variant?: "landing" | "chat" | "editor";
}

export const BackgroundBlobs: React.FC<BackgroundBlobsProps> = ({ variant = "landing" }) => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Ambient background blobs */}
      <div 
        className="blob w-[600px] h-[600px] bg-neon-cyan/20 -top-32 -left-32"
        style={{ animationDelay: "0s" }}
      />
      <div 
        className="blob w-[500px] h-[500px] bg-neon-magenta/20 top-1/2 -right-24"
        style={{ animationDelay: "-5s" }}
      />
      <div 
        className="blob w-[400px] h-[400px] bg-neon-lime/15 bottom-0 left-1/3"
        style={{ animationDelay: "-10s" }}
      />
      
      {variant === "chat" && (
        <>
          {/* Data stream lines */}
          <div className="data-line top-1/4 w-full" style={{ animationDelay: "0s" }} />
          <div className="data-line top-1/2 w-full" style={{ animationDelay: "-3s" }} />
          <div className="data-line top-3/4 w-full" style={{ animationDelay: "-6s" }} />
        </>
      )}
      
      {/* Grid overlay for tech feel */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
};
