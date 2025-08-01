"use client";

import { Button } from "@/components/ui/button";
import { Image as ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { FileItem } from "./types";

type Props = {
  files: FileItem[];
  setFiles: (updater: (prev: FileItem[]) => FileItem[]) => void;
  maxFiles: number;
};

export function ImageDropzone({ files, setFiles, maxFiles }: Props) {
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

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    multiple: true,
    maxFiles: maxFiles - files.length,
    maxSize: 5 * 1024 * 1024,
    noClick: files.length >= maxFiles,
  });

  return (
    <>
      {files.length > 0 && (
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
      )}

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
    </>
  );
}
