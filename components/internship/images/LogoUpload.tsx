"use client";

import { Button } from "@/components/ui/button";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { FileItem } from "@/types/interfaces";

type LogoUploadProps = {
  file: FileItem | null;
  setFile: (file: FileItem | null) => void;
  existingLogoUrl?: string | null;
  onRemoveExisting?: () => void;
  className?: string;
};

export function LogoUpload({
  file,
  setFile,
  existingLogoUrl,
  onRemoveExisting,
  className,
}: LogoUploadProps) {
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const selectedFile = acceptedFiles[0];
    const newFile: FileItem = {
      name: selectedFile.name,
      size: selectedFile.size,
      file: selectedFile,
      preview: URL.createObjectURL(selectedFile),
    };
    
    setFile(newFile);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    multiple: false,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const removeFile = () => {
    if (file) {
      URL.revokeObjectURL(file.preview);
    }
    setFile(null);
  };

  const removeExisting = () => {
    if (onRemoveExisting) {
      onRemoveExisting();
    }
  };

  const displayUrl = file?.preview || existingLogoUrl;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-4">
        {displayUrl && (
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
              <Image
                src={displayUrl}
                alt="Logo"
                className="w-full h-full object-cover"
                width={80}
                height={80}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute -top-1 -right-1 h-6 w-6 p-0 rounded-full bg-white hover:bg-red-50"
              onClick={file ? removeFile : removeExisting}
            >
              <X className="w-3 h-3" />
            </Button>
            {file?.uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <div className="text-white text-xs">{file.progress}%</div>
              </div>
            )}
            {file?.error && (
              <div className="absolute inset-0 bg-red-500 bg-opacity-50 rounded-full flex items-center justify-center">
                <div className="text-white text-xs">!</div>
              </div>
            )}
          </div>
        )}
        
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "h-10",
              displayUrl && "text-blue-600 bg-blue-50"
            )}
          >
            <ImagePlus className="w-4 h-4 mr-2" />
            {displayUrl ? "Change Logo" : "Upload Logo"}
          </Button>
        </div>
      </div>
      {file && !file.uploading && !file.error && (
        <p className="text-xs text-gray-500">{file.name}</p>
      )}
    </div>
  );
}

