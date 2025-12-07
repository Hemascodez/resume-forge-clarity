import React, { useState, useCallback } from "react";
import { Upload, FileText, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  acceptedTypes?: string;
  className?: string;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileSelect,
  acceptedTypes = ".pdf,.doc,.docx",
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        setUploadedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setUploadedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      className={cn(
        "relative group cursor-pointer transition-all duration-500",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={acceptedTypes}
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      
      <div
        className={cn(
          "relative flex flex-col items-center justify-center gap-4 p-8 md:p-12 rounded-3xl border-2 border-dashed transition-all duration-500 min-h-[200px]",
          isDragging
            ? "border-primary bg-primary/10 scale-[1.02] pulse-glow"
            : uploadedFile
            ? "border-neon-lime bg-neon-lime/5 glow-lime"
            : "border-border bg-secondary/20 hover:border-primary/50 hover:bg-secondary/30"
        )}
      >
        {/* Gradient border overlay when dragging */}
        {isDragging && (
          <div className="absolute inset-0 rounded-3xl bg-gradient-primary opacity-20 animate-pulse" />
        )}

        <div
          className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
            uploadedFile
              ? "bg-neon-lime/20"
              : isDragging
              ? "bg-primary/20"
              : "bg-secondary/50 group-hover:bg-secondary"
          )}
        >
          {uploadedFile ? (
            <Check className="w-8 h-8 text-neon-lime" />
          ) : (
            <Upload
              className={cn(
                "w-8 h-8 transition-all duration-300",
                isDragging ? "text-primary scale-110" : "text-muted-foreground"
              )}
            />
          )}
        </div>

        {uploadedFile ? (
          <div className="text-center">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <FileText className="w-4 h-4 text-neon-lime" />
              {uploadedFile.name}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Click or drag to replace
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-foreground font-medium">
              {isDragging ? "Drop your resume here" : "Upload your resume"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Drag & drop or click to browse • PDF, DOC, DOCX
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
