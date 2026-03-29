"use client";

import { useState, useCallback } from "react";
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
  loading?: boolean;
};

type ExistingImagesProps = {
  existingImages: string[];
  onRemoveExisting: (imageId: string) => void;
  loading?: boolean;
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

    let i = 0;
    const newFiles: FileItem[] = filesToAdd.map((file) => {
      const addedAt = Date.now() + i++;
      return {
        id: `${file.name}-${addedAt}`,
        name: file.name,
        size: file.size,
        file,
        preview: URL.createObjectURL(file),
        kind: "image" as const,
        addedAt,
      };
    });

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
  loading,
}: Pick<BaseProps, "files" | "setFiles" | "loading">) {
  const removeFile = (fileItem: FileItem) => {
    if (loading || fileItem.uploading) return;
    setFiles((prev) => {
      const updated = [...prev];
      const index = updated.findIndex(
        (f) => f.name === fileItem.name && f.addedAt === fileItem.addedAt
      );
      if (index !== -1) {
        URL.revokeObjectURL(updated[index].preview);
        updated.splice(index, 1);
      }
      return updated;
    });
  };

  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 py-2">
      {files.map((file) => (
        <div key={file.id} className="group relative">
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
            onClick={() => removeFile(file)}
            disabled={loading || file.uploading}
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
  loading,
}: ExistingImagesProps) {
  const [previewImageId, setPreviewImageId] = useState<string | null>(null);
  const [brokenImageIds, setBrokenImageIds] = useState<string[]>([]);

  if (existingImages.length === 0) return null;

  const getImageUrl = (imageId: string) =>
    tryGetStoragePublicUrl("opportunity-images", imageId);

  const isBrokenImage = (imageId: string) => brokenImageIds.includes(imageId);

  const markBrokenImage = (imageId: string) => {
    setBrokenImageIds((prev) =>
      prev.includes(imageId) ? prev : [...prev, imageId]
    );
  };

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
              {isBrokenImage(imageId) ? (
                <div className="flex h-full w-full items-center justify-center bg-gray-100 text-[10px] text-gray-500">
                  Invalid
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getImageUrl(imageId)}
                  alt="Existing image"
                  className="h-full w-full object-cover"
                  onError={() => markBrokenImage(imageId)}
                />
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-white p-0 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                if (loading) return;
                onRemoveExisting(imageId);
              }}
              disabled={loading}
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
              {isBrokenImage(previewImageId) ? (
                <div className="text-muted-foreground flex h-[40vh] w-full items-center justify-center text-sm">
                  Unable to preview this image URL
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getImageUrl(previewImageId)}
                  alt="Full preview"
                  className="h-auto max-h-[80vh] w-full object-contain"
                  onError={() => markBrokenImage(previewImageId)}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Unified preview for mixed image/attachment streams (e.g. Ungatekeep)
// ---------------------------------------------------------------------------

export function UnifiedFilesPreview({
  files,
  setFiles,
  attachmentFiles,
  setAttachmentFiles,
  loading,
}: {
  files: FileItem[];
  setFiles: (updater: (prev: FileItem[]) => FileItem[]) => void;
  attachmentFiles: FileItem[];
  setAttachmentFiles: (updater: (prev: FileItem[]) => FileItem[]) => void;
  loading?: boolean;
}) {
  const allFiles = [...files, ...attachmentFiles].sort(
    (a, b) => (a.addedAt || 0) - (b.addedAt || 0)
  );

  const removeFile = (fileItem: FileItem) => {
    if (loading || fileItem.uploading) return;
    if (fileItem.kind === "image") {
      setFiles((prev) => {
        const updated = [...prev];
        const index = updated.findIndex(
          (f) => f.name === fileItem.name && f.addedAt === fileItem.addedAt
        );
        if (index !== -1) {
          URL.revokeObjectURL(updated[index].preview);
          updated.splice(index, 1);
        }
        return updated;
      });
    } else {
      setAttachmentFiles((prev) => {
        const updated = [...prev];
        const index = updated.findIndex(
          (f) => f.name === fileItem.name && f.addedAt === fileItem.addedAt
        );
        if (index !== -1) {
          updated.splice(index, 1);
        }
        return updated;
      });
    }
  };

  if (allFiles.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 py-2">
      {allFiles.map((file) => (
        <div
          key={file.id}
          className="group bg-muted/10 hover:bg-muted/20 relative flex items-center justify-between gap-3 rounded-lg border p-2 transition-colors"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {file.kind === "image" ? (
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded border bg-gray-100">
                <Image
                  src={file.preview}
                  alt={file.name}
                  className="h-full w-full object-cover"
                  width={40}
                  height={40}
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border bg-gray-100">
                <AttachmentIcon kind={file.kind} />
              </div>
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-xs font-medium">{file.name}</span>
              <span className="text-muted-foreground text-[10px] uppercase">
                {formatBytes(file.size)} • {file.kind}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {file.uploading && (
              <div className="flex items-center gap-1.5">
                <div className="bg-muted h-1.5 w-12 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
                <span className="text-primary text-[10px] font-medium">
                  {file.progress}%
                </span>
              </div>
            )}
            {file.error && (
              <span className="text-[10px] font-medium text-red-500">
                Error
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full hover:bg-red-50 hover:text-red-500"
              onClick={() => removeFile(file)}
              disabled={loading || file.uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
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

    let i = 0;
    const newFiles: FileItem[] = filesToAdd.map((file) => {
      const addedAt = Date.now() + i++;
      return {
        id: `${file.name}-${addedAt}`,
        name: file.name,
        size: file.size,
        file,
        preview: "",
        kind: resolveFileKind(file),
        addedAt,
      };
    });

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

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newImages: FileItem[] = [];
      const newAttachments: FileItem[] = [];

      let i = 0;
      for (const file of acceptedFiles) {
        const addedAt = Date.now() + i++;
        const id = `${file.name}-${addedAt}`;
        if (isImageFile(file)) {
          if (totalImages + newImages.length < maxImageFiles) {
            newImages.push({
              id,
              name: file.name,
              size: file.size,
              file,
              preview: URL.createObjectURL(file),
              kind: "image" as const,
              addedAt,
            });
          }
        } else {
          if (totalAttachments + newAttachments.length < maxAttachmentFiles) {
            newAttachments.push({
              id,
              name: file.name,
              size: file.size,
              file,
              preview: "",
              kind: resolveFileKind(file),
              addedAt,
            });
          }
        }
      }

      if (newImages.length > 0) {
        setImageFiles((prev) => [...prev, ...newImages]);
      }
      if (newAttachments.length > 0) {
        setAttachmentFiles((prev) => [...prev, ...newAttachments]);
      }
    },
    [
      totalImages,
      maxImageFiles,
      totalAttachments,
      maxAttachmentFiles,
      setImageFiles,
      setAttachmentFiles,
    ]
  );

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
  loading,
}: Pick<BaseProps, "files" | "setFiles" | "loading">) {
  const removeFile = (fileItem: FileItem) => {
    if (loading || fileItem.uploading) return;
    setFiles((prev) => {
      const updated = [...prev];
      const index = updated.findIndex(
        (f) => f.name === fileItem.name && f.addedAt === fileItem.addedAt
      );
      if (index !== -1) {
        updated.splice(index, 1);
      }
      return updated;
    });
  };

  if (files.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 py-2">
      {files.map((file) => (
        <div
          key={file.id}
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
            onClick={() => removeFile(file)}
            disabled={loading || file.uploading}
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
  loading?: boolean;
};

export function ExistingAttachments({
  existingAttachments,
  onRemoveExisting,
  loading,
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
            onClick={() => {
              if (loading) return;
              onRemoveExisting(attachmentId);
            }}
            disabled={loading}
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
