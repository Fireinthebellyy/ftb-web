"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ImagePlus,
  Paperclip,
  FileText,
  FileSpreadsheet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { FileItem, FileKind } from "@/types/interfaces";
import { tryGetStoragePublicUrl } from "@/lib/storage/public-url";
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
      kind: "image" as const,
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
          "h-8 w-8 p-2",
          totalImages > 0 && "bg-blue-50 text-blue-600",
          totalImages >= maxFiles && "cursor-not-allowed opacity-50",
          buttonClassName
        )}
        disabled={totalImages >= maxFiles}
      >
        <ImagePlus className="h-4 w-4" />
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
        <div key={idx} className="group relative">
          <div className="h-16 w-16 overflow-hidden rounded-lg border bg-gray-100">
            <Image
              src={file.preview}
              alt={file.name}
              className="h-full w-full object-cover"
              width={64}
              height={64}
            />
            {file.uploading && (
              <div className="bg-opacity-50 absolute inset-0 flex items-center justify-center bg-black">
                <div className="text-xs text-white">{file.progress}%</div>
              </div>
            )}
            {file.error && (
              <div className="bg-opacity-50 absolute inset-0 flex items-center justify-center bg-red-500">
                <div className="text-xs text-white">!</div>
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0"
            onClick={() => removeFile(idx)}
          >
            <X className="h-2 w-2" />
          </Button>
        </div>
      ))}
    </div>
  );
}

/**
 * ExistingImages:
 * Renders existing image thumbnails with remove buttons.
 */
export function ExistingImages({
  existingImages,
  onRemoveExisting,
}: ExistingImagesProps) {
  const [previewImageId, setPreviewImageId] = useState<string | null>(null);

  if (existingImages.length === 0) return null;

  const getImageUrl = (imageId: string) =>
    tryGetStoragePublicUrl("opportunity-images", imageId);

  return (
    <>
      <div className="flex flex-wrap gap-2 py-2">
        {existingImages.map((imageId) => (
          <div key={imageId} className="group relative">
            <div
              className="h-16 w-16 cursor-pointer overflow-hidden rounded-lg border bg-gray-100 transition-opacity hover:opacity-90"
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
                className="h-full w-full object-cover"
                width={64}
                height={64}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-white p-0 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveExisting(imageId);
              }}
            >
              <X className="h-2 w-2" />
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
          className="max-w-3xl overflow-hidden p-0"
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
                className="h-auto max-h-[80vh] w-full object-contain"
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

// ---------------------------------------------------------------------------
// Attachment (PDF / PPT) picker and preview components
// ---------------------------------------------------------------------------

function resolveFileKind(file: File): FileKind {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "ppt" || ext === "pptx") return "ppt";
  return "image";
}

function AttachmentIcon({ kind }: { kind: FileKind }) {
  if (kind === "pdf")
    return <FileText className="h-5 w-5 shrink-0 text-red-500" />;
  return <FileSpreadsheet className="h-5 w-5 shrink-0 text-orange-500" />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type AttachmentBaseProps = {
  files: FileItem[];
  setFiles: (updater: (prev: FileItem[]) => FileItem[]) => void;
  maxFiles: number;
  className?: string;
  buttonClassName?: string;
};

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB

export function AttachmentPicker({
  files,
  setFiles,
  maxFiles,
  className,
  buttonClassName,
  existingAttachmentsCount = 0,
}: AttachmentBaseProps & { existingAttachmentsCount?: number }) {
  const totalAttachments = files.length + existingAttachmentsCount;

  const onDrop = (acceptedFiles: File[]) => {
    const remainingSlots = maxFiles - totalAttachments;
    if (remainingSlots <= 0) return;

    const filesToAdd = acceptedFiles.slice(0, remainingSlots);

    const newFiles: FileItem[] = filesToAdd.map((file) => ({
      name: file.name,
      size: file.size,
      file,
      preview: "",
      kind: resolveFileKind(file),
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        [".pptx"],
    },
    multiple: true,
    maxFiles: Math.max(0, maxFiles - totalAttachments),
    maxSize: MAX_ATTACHMENT_SIZE,
    noClick: totalAttachments >= maxFiles,
  });

  return (
    <div {...getRootProps()} className={className}>
      <input {...getInputProps()} />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 w-8 p-2",
          totalAttachments > 0 && "bg-blue-50 text-blue-600",
          totalAttachments >= maxFiles && "cursor-not-allowed opacity-50",
          buttonClassName
        )}
        disabled={totalAttachments >= maxFiles}
      >
        <Paperclip className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Unified file picker: single button for images + documents (PDF/PPT)
// ---------------------------------------------------------------------------

type UnifiedFilePickerProps = {
  imageFiles: FileItem[];
  setImageFiles: (updater: (prev: FileItem[]) => FileItem[]) => void;
  maxImageFiles: number;
  existingImagesCount?: number;
  attachmentFiles: FileItem[];
  setAttachmentFiles: (updater: (prev: FileItem[]) => FileItem[]) => void;
  maxAttachmentFiles: number;
  existingAttachmentsCount?: number;
  className?: string;
  buttonClassName?: string;
  showLabel?: boolean;
  label?: string;
  compactLabel?: string;
};

const IMAGE_EXTENSIONS = new Set(["jpeg", "jpg", "png", "gif", "webp"]);

function isImageFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXTENSIONS.has(ext) || file.type.startsWith("image/");
}

export function UnifiedFilePicker({
  imageFiles,
  setImageFiles,
  maxImageFiles,
  existingImagesCount = 0,
  attachmentFiles,
  setAttachmentFiles,
  maxAttachmentFiles,
  existingAttachmentsCount = 0,
  className,
  buttonClassName,
  showLabel = false,
  label = "Uploads",
  compactLabel,
}: UnifiedFilePickerProps) {
  const totalImages = imageFiles.length + existingImagesCount;
  const totalAttachments = attachmentFiles.length + existingAttachmentsCount;
  const allFull =
    totalImages >= maxImageFiles && totalAttachments >= maxAttachmentFiles;
  const hasAnyFiles = totalImages > 0 || totalAttachments > 0;

  const onDrop = (acceptedFiles: File[]) => {
    const newImages: FileItem[] = [];
    const newAttachments: FileItem[] = [];

    for (const file of acceptedFiles) {
      if (isImageFile(file)) {
        if (totalImages + newImages.length < maxImageFiles) {
          newImages.push({
            name: file.name,
            size: file.size,
            file,
            preview: URL.createObjectURL(file),
            kind: "image" as const,
          });
        }
      } else {
        if (totalAttachments + newAttachments.length < maxAttachmentFiles) {
          newAttachments.push({
            name: file.name,
            size: file.size,
            file,
            preview: "",
            kind: resolveFileKind(file),
          });
        }
      }
    }

    if (newImages.length > 0) setImageFiles((prev) => [...prev, ...newImages]);
    if (newAttachments.length > 0)
      setAttachmentFiles((prev) => [...prev, ...newAttachments]);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
      "application/pdf": [".pdf"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        [".pptx"],
    },
    multiple: true,
    maxSize: MAX_ATTACHMENT_SIZE,
    noClick: allFull,
  });

  return (
    <div {...getRootProps()} className={className}>
      <input {...getInputProps()} />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          showLabel
            ? "h-auto w-11 flex-col gap-1 p-1.5 text-[10px] leading-none text-gray-600 md:w-14 md:text-[11px]"
            : "h-8 w-8 p-2",
          hasAnyFiles && "bg-blue-50 text-blue-600",
          allFull && "cursor-not-allowed opacity-50",
          buttonClassName
        )}
        disabled={allFull}
      >
        <Paperclip className="h-4 w-4" />
        {showLabel && (
          <>
            {compactLabel ? (
              <>
                <span className="md:hidden">{compactLabel}</span>
                <span className="hidden md:inline">{label}</span>
              </>
            ) : (
              <span>{label}</span>
            )}
          </>
        )}
      </Button>
    </div>
  );
}

export function SelectedAttachments({
  files,
  setFiles,
}: Pick<AttachmentBaseProps, "files" | "setFiles">) {
  const removeFile = (index: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  if (files.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 py-2">
      {files.map((file, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2 rounded-md border bg-gray-50 px-2 py-1.5 text-sm"
        >
          <AttachmentIcon kind={file.kind} />
          <span className="max-w-[180px] flex-1 truncate">{file.name}</span>
          <span className="text-muted-foreground shrink-0 text-xs">
            {formatBytes(file.size)}
          </span>
          {file.uploading && (
            <span className="shrink-0 text-xs text-blue-600">
              {file.progress}%
            </span>
          )}
          {file.error && (
            <span className="shrink-0 text-xs text-red-500">Failed</span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-5 w-5 shrink-0 p-0"
            onClick={() => removeFile(idx)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}

type ExistingAttachmentsProps = {
  existingAttachments: string[];
  onRemoveExisting: (attachmentId: string) => void;
};

export function ExistingAttachments({
  existingAttachments,
  onRemoveExisting,
}: ExistingAttachmentsProps) {
  if (existingAttachments.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 py-2">
      {existingAttachments.map((attachmentId) => (
        <div
          key={attachmentId}
          className="flex items-center gap-2 rounded-md border bg-gray-50 px-2 py-1.5 text-sm"
        >
          <FileText className="h-5 w-5 shrink-0 text-red-500" />
          <span className="text-muted-foreground max-w-[180px] flex-1 truncate">
            {attachmentId.slice(0, 12)}…
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-5 w-5 shrink-0 p-0 hover:bg-red-50"
            onClick={() => onRemoveExisting(attachmentId)}
          >
            <X className="h-3 w-3" />
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
