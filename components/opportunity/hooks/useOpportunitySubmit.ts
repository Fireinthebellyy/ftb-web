"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  deleteStorageObjectClient,
  uploadFileViaSignedUrl,
} from "@/lib/storage/client";
import { FileItem, Opportunity } from "@/types/interfaces";
import { FormData } from "../schema";

interface UseOpportunitySubmitProps {
  opportunity?: Opportunity;
  files: FileItem[];
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
  attachmentFiles: FileItem[];
  setAttachmentFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
  existingImages: string[];
  existingAttachments: string[];
  onOpportunityCreated: () => void;
  setRemovedImageIds: React.Dispatch<React.SetStateAction<string[]>>;
  removedImageIds: string[];
  setRemovedAttachmentIds: React.Dispatch<React.SetStateAction<string[]>>;
  removedAttachmentIds: string[];
}

async function uploadFilesToBucket(
  items: FileItem[],
  setItems: React.Dispatch<React.SetStateAction<FileItem[]>>,
  domain: "opportunity-images" | "opportunity-attachments"
): Promise<{ ids: string[]; success: boolean }> {
  if (items.length === 0) return { ids: [], success: true };

  const uploadedIds: string[] = [];
  let hasError = false;

  setItems((prev) => prev.map((f) => ({ ...f, uploading: true, progress: 0 })));

  for (let i = 0; i < items.length; i++) {
    const file = items[i];
    try {
      const result = await uploadFileViaSignedUrl({
        domain,
        file: file.file,
        onProgress: (progress: number) => {
          const uploadProgress = Math.round(progress || 0);
          setItems((prev) =>
            prev.map((f) =>
              f.id === file.id ? { ...f, progress: uploadProgress } : f
            )
          );
        },
      });

      uploadedIds.push(result.key);
      setItems((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, uploading: false, fileId: result.key } : f
        )
      );
    } catch (err) {
      console.error(`Upload failed for ${file.name}:`, err);
      hasError = true;
      const errorMessage =
        err instanceof Error ? err.message : "Unknown upload error";
      setItems((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, uploading: false, error: true, errorMessage } : f
        )
      );
      toast.error(`Failed to upload "${file.name}": ${errorMessage}`);
    }
  }

  return { ids: uploadedIds, success: !hasError };
}

async function deleteFileIds(
  ids: string[],
  domain: "opportunity-images" | "opportunity-attachments"
): Promise<void> {
  if (ids.length === 0) return;

  for (const fileId of ids) {
    try {
      await deleteStorageObjectClient(domain, fileId);
    } catch (err) {
      console.error(`Failed to delete file ${fileId}:`, err);
    }
  }
}

export function useOpportunitySubmit({
  opportunity,
  files,
  setFiles,
  attachmentFiles,
  setAttachmentFiles,
  existingImages,
  existingAttachments,
  onOpportunityCreated,
  setRemovedImageIds,
  removedImageIds,
  setRemovedAttachmentIds,
  removedAttachmentIds,
}: UseOpportunitySubmitProps) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  async function onSubmit(data: FormData) {
    setLoading(true);

    try {
      const [imageResult, attachmentResult] = await Promise.all([
        uploadFilesToBucket(files, setFiles, "opportunity-images"),
        uploadFilesToBucket(
          attachmentFiles,
          setAttachmentFiles,
          "opportunity-attachments"
        ),
      ]);

      if (!imageResult.success || !attachmentResult.success) {
        toast.error(
          `One or more files failed to upload. Fix the failed uploads and try again. ${opportunity ? "Post was not updated." : "Post was not created."}`
        );
        return;
      }

      const finalImages = [...existingImages, ...imageResult.ids];
      const finalAttachments = [
        ...existingAttachments,
        ...attachmentResult.ids,
      ];

      const { dateRange, tags: _tags, ...restData } = data;

      const payload: Record<string, unknown> = {
        ...restData,
        startDate: dateRange?.from?.toISOString(),
        endDate: dateRange?.to?.toISOString(),
        tags:
          data.tags
            ?.split("|")
            .map((t) => t.trim())
            .filter(Boolean) || [],
        images: opportunity?.id
          ? finalImages
          : imageResult.ids.length > 0
            ? imageResult.ids
            : undefined,
        attachments: opportunity?.id
          ? finalAttachments
          : attachmentResult.ids.length > 0
            ? attachmentResult.ids
            : undefined,
      };

      if (payload.publishAt) {
        const localPublishAt = new Date(payload.publishAt as string);
        if (!Number.isNaN(localPublishAt.getTime())) {
          payload.publishAt = localPublishAt.toISOString();
        }
      }

      let res;
      if (opportunity?.id) {
        delete payload.publishAt;
        res = await axios.put(`/api/opportunities/${opportunity.id}`, payload);

        await Promise.all([
          deleteFileIds(removedImageIds, "opportunity-images"),
          deleteFileIds(removedAttachmentIds, "opportunity-attachments"),
        ]);
      } else {
        res = await axios.post("/api/opportunities", payload);
      }

      files.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
      setFiles([]);
      setAttachmentFiles([]);
      setRemovedImageIds([]);
      setRemovedAttachmentIds([]);

      const userRole = res.data?.userRole || "user";
      const needsReview = userRole === "user";

      toast.success(
        opportunity?.id
          ? "Opportunity updated successfully!"
          : needsReview
            ? "Opportunity submitted for review! It will be visible once approved by an admin."
            : "Opportunity submitted successfully!"
      );
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      onOpportunityCreated();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const apiMessage =
          typeof err.response?.data?.error === "string"
            ? err.response.data.error
            : err.message;
        toast.error(apiMessage);
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  }

  return { onSubmit, loading };
}
