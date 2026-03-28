"use client";

import axios from "axios";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  deleteStorageObjectClient,
  uploadFileViaSignedUrl,
} from "@/lib/storage/client";
import { TitleField } from "./fields/TitleField";
import { DescriptionField } from "./fields/DescriptionField";
import { TagsField } from "./fields/TagsField";
import { TypeSelector } from "./fields/TypeSelector";
import { MetaPopovers } from "./fields/MetaPopovers";
import {
  UnifiedFilePicker,
  SelectedImages,
  ExistingImages,
  SelectedAttachments,
  ExistingAttachments,
} from "./images/ImageDropzone";
import { formSchema, FormData } from "./schema";
import { FileItem } from "@/types/interfaces";
import { useQueryClient } from "@tanstack/react-query";
import { opportunities } from "@/lib/schema";
import { InferSelectModel } from "drizzle-orm";

type Opportunity = InferSelectModel<typeof opportunities> & { tags?: string[] };

interface EditOpportunityFormProps {
  opportunity: Opportunity;
  onOpportunityUpdated: () => void;
  onCancel: () => void;
}

export default function EditOpportunityForm({
  opportunity,
  onOpportunityUpdated,
  onCancel,
}: EditOpportunityFormProps) {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<FileItem[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(
    opportunity?.images || []
  );
  const [existingAttachments, setExistingAttachments] = useState<string[]>(
    (opportunity as any)?.attachments || []
  );
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>(
    []
  );
  const queryClient = useQueryClient();

  const handleRemoveExistingImage = (imageId: string) => {
    setExistingImages((prev) => prev.filter((id) => id !== imageId));
    setRemovedImageIds((prev) => [...prev, imageId]);
  };

  const handleRemoveExistingAttachment = (attachmentId: string) => {
    setExistingAttachments((prev) => prev.filter((id) => id !== attachmentId));
    setRemovedAttachmentIds((prev) => [...prev, attachmentId]);
  };

  async function deleteRemovedFiles(): Promise<void> {
    await Promise.all([
      ...removedImageIds.map(async (fileId) => {
        try {
          await deleteStorageObjectClient("opportunity-images", fileId);
        } catch (err) {
          console.error(`Failed to delete image ${fileId}:`, err);
        }
      }),
      ...removedAttachmentIds.map(async (fileId) => {
        try {
          await deleteStorageObjectClient("opportunity-attachments", fileId);
        } catch (err) {
          console.error(`Failed to delete attachment ${fileId}:`, err);
        }
      }),
    ]);
  }

  const maxFiles = 10;
  const maxAttachments = 2;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      type: opportunity.type || "",
      title: opportunity.title || "",
      description: opportunity.description || "",
      tags: opportunity.tags?.join("|") || "",
      location: opportunity.location || "",
      organiserInfo: opportunity.organiserInfo || "",
      dateRange: undefined,
    },
  });

  const watchedType = form.watch("type");
  const watchedLocation = form.watch("location");
  const watchedOrganiser = form.watch("organiserInfo");
  const watchedDateRange = form.watch("dateRange");

  useEffect(() => {
    if (opportunity.startDate || opportunity.endDate) {
      form.setValue("dateRange", {
        from: opportunity.startDate
          ? new Date(opportunity.startDate)
          : undefined,
        to: opportunity.endDate ? new Date(opportunity.endDate) : undefined,
      });
    }
  }, [opportunity, form]);

  function handleTypeChange(type: string) {
    form.setValue("type", type, { shouldValidate: true, shouldTouch: true });
  }

  async function uploadFiles(
    items: FileItem[],
    setItems: React.Dispatch<React.SetStateAction<FileItem[]>>,
    domain: "opportunity-images" | "opportunity-attachments"
  ): Promise<{ ids: string[]; success: boolean }> {
    if (items.length === 0) return { ids: [], success: true };

    const uploadedFileIds: string[] = [];

    setItems((prev) =>
      prev.map((file) => ({ ...file, uploading: true, progress: 0 }))
    );

    for (let i = 0; i < items.length; i++) {
      const file = items[i];
      try {
        const uploaded = await uploadFileViaSignedUrl({
          domain,
          file: file.file,
          onProgress: (progress) => {
            const percent = Math.round(progress || 0);
            setItems((prev) =>
              prev.map((f) =>
                f.id === file.id ? { ...f, progress: percent } : f
              )
            );
          },
        });

        uploadedFileIds.push(uploaded.key);
        setItems((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, uploading: false, fileId: uploaded.key } : f
          )
        );
      } catch (err) {
        console.error(`Upload failed for ${file.name}:`, err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown upload error";
        setItems((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, uploading: false, error: true, errorMessage }
              : f
          )
        );
        toast.error(`Failed to upload "${file.name}": ${errorMessage}`);
        return { ids: [], success: false };
      }
    }

    return { ids: uploadedFileIds, success: true };
  }

  async function onSubmit(data: FormData) {
    setLoading(true);

    try {
      const [imageResult, attachmentResult] = await Promise.all([
        uploadFiles(files, setFiles, "opportunity-images"),
        uploadFiles(
          attachmentFiles,
          setAttachmentFiles,
          "opportunity-attachments"
        ),
      ]);

      if (!imageResult.success || !attachmentResult.success) {
        toast.error(
          "One or more files failed to upload. Fix the failed uploads and try again. Post was not updated."
        );
        throw new Error(
          "One or more files failed to upload. Post was not updated."
        );
      }

      const finalImages = [...existingImages, ...imageResult.ids];
      const finalAttachments = [
        ...existingAttachments,
        ...attachmentResult.ids,
      ];

      const res = await axios.put(`/api/opportunities/${opportunity.id}`, {
        ...data,
        startDate: data.dateRange?.from?.toISOString(),
        endDate: data.dateRange?.to?.toISOString(),
        tags:
          data.tags
            ?.split("|")
            .map((t) => t.trim())
            .filter(Boolean) || [],
        images: finalImages,
        attachments: finalAttachments,
      });

      if (res.status !== 200) {
        throw new Error("Failed to update opportunity");
      }

      await deleteRemovedFiles();

      files.forEach((file) => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
      setFiles([]);
      setAttachmentFiles([]);
      setRemovedImageIds([]);
      setRemovedAttachmentIds([]);

      toast.success("Opportunity updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      onOpportunityUpdated();
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-1">
          <TitleField control={form.control} />

          <DescriptionField control={form.control} />

          <ExistingImages
            existingImages={existingImages}
            onRemoveExisting={handleRemoveExistingImage}
          />

          <SelectedImages files={files} setFiles={setFiles} />

          <ExistingAttachments
            existingAttachments={existingAttachments}
            onRemoveExisting={handleRemoveExistingAttachment}
          />

          <SelectedAttachments
            files={attachmentFiles}
            setFiles={setAttachmentFiles}
          />

          <TagsField control={form.control} />

          <TypeSelector
            control={form.control}
            value={watchedType}
            onChange={handleTypeChange}
          />

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4">
              <MetaPopovers
                control={form.control}
                watchedLocation={watchedLocation}
                watchedOrganiser={watchedOrganiser}
                watchedDateRange={watchedDateRange}
              />
              <UnifiedFilePicker
                imageFiles={files}
                setImageFiles={setFiles}
                maxImageFiles={maxFiles}
                existingImagesCount={existingImages.length}
                attachmentFiles={attachmentFiles}
                setAttachmentFiles={setAttachmentFiles}
                maxAttachmentFiles={maxAttachments}
                existingAttachmentsCount={existingAttachments.length}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                size="sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                size="sm"
                className="px-6"
              >
                {loading ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </FormProvider>
  );
}
