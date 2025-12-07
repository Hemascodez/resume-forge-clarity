import React from "react";

interface BackgroundBlobsProps {
  variant?: "landing" | "chat" | "editor";
}

export const BackgroundBlobs: React.FC<BackgroundBlobsProps> = ({ variant = "landing" }) => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Clean Airbnb-style subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-background to-accent/[0.03]" />
      
      {/* Subtle decorative shapes */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-accent/[0.04] blur-3xl" />
      
      {variant === "chat" && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.02] blur-3xl" />
      )}
    </div>
  );
};
