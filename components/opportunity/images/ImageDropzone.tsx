"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { FileItem } from "@/types/interfaces";
import { createOpportunityStorage } from "@/lib/appwrite";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BaseProps = {
  files: FileItem[];
  setFiles: (updater: (prev: FileItem[]) => FileItem[]) => void;
  maxFiles: number;
  className?: string;
  buttonClassName?: string;
};

type ExistingImagesProps = {
  existingImages: string[];
  onRemoveExisting: (imageId: string) => void;
};

export function ImagePicker({
  files,
  setFiles,
  maxFiles,
  className,
  buttonClassName,
  existingImagesCount = 0,
}: BaseProps & { existingImagesCount?: number }) {
  const totalImages = files.length + existingImagesCount;
  
  const onDrop = (acceptedFiles: File[]) => {
    const remainingSlots = maxFiles - totalImages;
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
    maxFiles: Math.max(0, maxFiles - totalImages),
    maxSize: 5 * 1024 * 1024,
    noClick: totalImages >= maxFiles,
  });

  return (
    <div {...getRootProps()} className={className}>
      <input {...getInputProps()} />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "p-2 h-8 w-8",
          totalImages > 0 && "text-blue-600 bg-blue-50",
          totalImages >= maxFiles && "opacity-50 cursor-not-allowed",
          buttonClassName
        )}
        disabled={totalImages >= maxFiles}
      >
        <ImagePlus className="w-4 h-4" />
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

// Get bucket ID with validation
const getBucketId = (): string | null => {
  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_OPPORTUNITIES_BUCKET_ID;
  if (!bucketId) {
    if (process.env.NODE_ENV === "development") {
      console.warn("NEXT_PUBLIC_APPWRITE_OPPORTUNITIES_BUCKET_ID is not configured");
    }
    return null;
  }
  return bucketId;
};

/**
 * ExistingImages:
 * Renders existing image thumbnails (from Appwrite storage) with remove buttons.
 */
export function ExistingImages({
  existingImages,
  onRemoveExisting,
}: ExistingImagesProps) {
  const [previewImageId, setPreviewImageId] = useState<string | null>(null);
  const opportunityStorage = createOpportunityStorage();
  const bucketId = getBucketId();

  if (existingImages.length === 0) return null;
  if (!bucketId) return null; // Gracefully handle missing bucket ID

  const getImageUrl = (imageId: string) =>
    opportunityStorage.getFileView(bucketId, imageId);

  return (
    <>
      <div className="flex flex-wrap gap-2 py-2">
        {existingImages.map((imageId) => (
          <div key={imageId} className="relative group">
            <div
              className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setPreviewImageId(imageId)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setPreviewImageId(imageId);
                }
              }}
            >
              <Image
                src={getImageUrl(imageId)}
                alt="Existing image"
                className="w-full h-full object-cover"
                width={64}
                height={64}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 rounded-full bg-white hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveExisting(imageId);
              }}
            >
              <X className="w-2 h-2" />
            </Button>
          </div>
        ))}
      </div>

      {/* Full image preview modal */}
      <Dialog
        open={previewImageId !== null}
        onOpenChange={(open) => !open && setPreviewImageId(null)}
      >
        <DialogContent
          className="max-w-3xl p-0 overflow-hidden"
          overlayClassName="bg-black/70"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {previewImageId && (
            <div className="relative">
              <Image
                src={getImageUrl(previewImageId)}
                alt="Full preview"
                className="w-full h-auto max-h-[80vh] object-contain"
                width={800}
                height={600}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Backward-compatible export so existing imports continue to work.
 * This renders the picker button (no previews). Use SelectedImages to show previews.
 */
export { ImagePicker as ImageDropzone };
