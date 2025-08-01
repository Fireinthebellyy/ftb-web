"use client";

import { Button } from "@/components/ui/button";
import { Image as ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { FileItem } from "@/types/interfaces";

type BaseProps = {
  files: FileItem[];
  setFiles: (updater: (prev: FileItem[]) => FileItem[]) => void;
  maxFiles: number;
};

export function ImagePicker({ files, setFiles, maxFiles }: BaseProps) {
  const onDrop = (acceptedFiles: File[]) => {
    const remainingSlots = maxFiles - files.length;
    if (remainingSlots <= 0) return;

    const filesToAdd = acceptedFiles.slice(0, remainingSlots);

    const newFiles: FileItem[] = filesToAdd.map((file) => ({
      name: file.name,
      size: file.size,
      file,
      preview: URL.createObjectURL(file),
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    multiple: true,
    maxFiles: Math.max(0, maxFiles - files.length),
    maxSize: 5 * 1024 * 1024,
    noClick: files.length >= maxFiles,
  });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "p-2 h-8 w-8",
          files.length > 0 && "text-blue-600 bg-blue-50",
          files.length >= maxFiles && "opacity-50 cursor-not-allowed"
        )}
        disabled={files.length >= maxFiles}
      >
        <ImageIcon className="w-4 h-4" />
      </Button>
    </div>
  );
}

/**
 * SelectedImages:
 * Only renders the selected image thumbnails with remove buttons and statuses.
 */
export function SelectedImages({
  files,
  setFiles,
}: Pick<BaseProps, "files" | "setFiles">) {
  const removeFile = (index: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 py-2">
      {files.map((file, idx) => (
        <div key={idx} className="relative group">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border">
            <Image
              src={file.preview}
              alt={file.name}
              className="w-full h-full object-cover"
              width={64}
              height={64}
            />
            {file.uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-xs">{file.progress}%</div>
              </div>
            )}
            {file.error && (
              <div className="absolute inset-0 bg-red-500 bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-xs">!</div>
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="absolute -top-1 -right-1 h-4 w-4 p-0 rounded-full "
            onClick={() => removeFile(idx)}
          >
            <X className="w-2 h-2" />
          </Button>
        </div>
      ))}
    </div>
  );
}

/**
 * Backward-compatible export so existing imports continue to work.
 * This renders the picker button (no previews). Use SelectedImages to show previews.
 */
export { ImagePicker as ImageDropzone };
