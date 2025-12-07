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
        "relative group cursor-pointer transition-all duration-300",
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
          "relative flex flex-col items-center justify-center gap-4 p-8 md:p-12 rounded-2xl border-2 border-dashed transition-all duration-300 min-h-[200px]",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : uploadedFile
            ? "border-accent bg-accent/5"
            : "border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50"
        )}
      >
        {/* 3D Icon Container */}
        <div
          className={cn(
            "w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg",
            uploadedFile
              ? "bg-gradient-to-br from-accent to-accent/80"
              : isDragging
              ? "bg-gradient-to-br from-primary to-primary/80"
              : "bg-gradient-to-br from-secondary to-secondary/80 group-hover:from-primary/10 group-hover:to-primary/5"
          )}
          style={{
            transform: isDragging ? "translateY(-4px)" : "translateY(0)",
            boxShadow: uploadedFile 
              ? "0 8px 24px hsl(142 76% 45% / 0.3)" 
              : isDragging 
              ? "0 8px 24px hsl(211 100% 50% / 0.3)"
              : "0 4px 12px hsl(220 13% 91% / 0.5)"
          }}
        >
          {uploadedFile ? (
            <Check className="w-10 h-10 text-accent-foreground" />
          ) : (
            <Upload
              className={cn(
                "w-10 h-10 transition-all duration-300",
                isDragging ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
              )}
            />
          )}
        </div>

        {uploadedFile ? (
          <div className="text-center">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <FileText className="w-4 h-4 text-accent" />
              {uploadedFile.name}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Click or drag to replace
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-foreground font-semibold text-lg">
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
