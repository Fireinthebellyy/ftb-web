"use client";

import axios from "axios";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createOpportunityStorage } from "@/lib/appwrite";
import { TitleField } from "./fields/TitleField";
import { DescriptionField } from "./fields/DescriptionField";
import { TagsField } from "./fields/TagsField";
import { TypeSelector } from "./fields/TypeSelector";
import { MetaPopovers } from "./fields/MetaPopovers";
import { ImagePicker, SelectedImages, ExistingImages } from "./images/ImageDropzone";
import { formSchema, FormData } from "./schema";
import { FileItem, UploadProgress } from "@/types/interfaces";
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
  const [existingImages, setExistingImages] = useState<string[]>(
    opportunity?.images || []
  );
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // Handle removing an existing image - track for deletion on submit
  const handleRemoveExistingImage = (imageId: string) => {
    setExistingImages((prev) => prev.filter((id) => id !== imageId));
    setRemovedImageIds((prev) => [...prev, imageId]);
  };

  // Delete removed images from Appwrite storage
  async function deleteRemovedImages(): Promise<void> {
    if (removedImageIds.length === 0) return;

    const bucketId = process.env.NEXT_PUBLIC_APPWRITE_OPPORTUNITIES_BUCKET_ID;
    if (!bucketId) return;

    const opportunityStorage = createOpportunityStorage();
    
    for (const imageId of removedImageIds) {
      try {
        await opportunityStorage.deleteFile(bucketId, imageId);
      } catch (err) {
        console.error(`Failed to delete image ${imageId}:`, err);
        // Continue deleting other images even if one fails
      }
    }
  }

  const maxFiles = 4;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      type: opportunity.type || "",
      title: opportunity.title || "",
      description: opportunity.description || "",
      tags: opportunity.tags?.join(", ") || "",
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
    // Set initial date range if available
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

  async function uploadImages(): Promise<{ ids: string[]; success: boolean }> {
    if (files.length === 0) return { ids: [], success: true };

    const uploadedFileIds: string[] = [];
    let hasError = false;

    setFiles((prev) =>
      prev.map((file) => ({ ...file, uploading: true, progress: 0 }))
    );

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const opportunityStorage = createOpportunityStorage();

        const res = await opportunityStorage.createFile(
          process.env.NEXT_PUBLIC_APPWRITE_OPPORTUNITIES_BUCKET_ID,
          "unique()",
          file.file,
          [],
          (progress: UploadProgress) => {
            const percent = Math.round((progress.progress || 0) * 100);
            setFiles((prev) =>
              prev.map((f, idx) =>
                idx === i ? { ...f, progress: percent } : f
              )
            );
          }
        );

        uploadedFileIds.push(res.$id);
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, uploading: false, fileId: res.$id } : f
          )
        );
      } catch (err) {
        console.error(`Upload failed for ${file.name}:`, err);
        hasError = true;
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  uploading: false,
                  error: true,
                  errorMessage:
                    err instanceof Error ? err.message : "Unknown upload error",
                }
              : f
          )
        );
        const message =
          err instanceof Error ? err.message : "Unknown upload error";
        toast.error(`Failed to upload "${file.name}": ${message}`);
      }
    }

    return { ids: uploadedFileIds, success: !hasError };
  }

  async function onSubmit(data: FormData) {
    setLoading(true);

    try {
      const { ids: imageIds, success: imagesOk } = await uploadImages();

      if (!imagesOk) {
        toast.error(
          "One or more images failed to upload. Fix the failed uploads and try again. Post was not updated."
        );
        throw new Error(
          "One or more images failed to upload. Post was not updated."
        );
      }

      // Combine existing images with newly uploaded images
      const finalImages = [...existingImages, ...imageIds];
      
      const res = await axios.put(`/api/opportunities/${opportunity.id}`, {
        ...data,
        startDate: data.dateRange?.from?.toISOString(),
        endDate: data.dateRange?.to?.toISOString(),
        tags:
          data.tags
            ?.split(",")
            .map((t) => t.trim())
            .filter(Boolean) || [],
        images: finalImages,
      });

      if (res.status !== 200) {
        throw new Error("Failed to update opportunity");
      }

      // Delete removed images from Appwrite storage after successful update
      await deleteRemovedImages();

      files.forEach((file) => URL.revokeObjectURL(file.preview));
      setFiles([]);
      setRemovedImageIds([]);

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

          {/* Existing images (from opportunity) displayed with remove option */}
          <ExistingImages
            existingImages={existingImages}
            onRemoveExisting={handleRemoveExistingImage}
          />

          {/* Selected new images displayed above the bottom action bar */}
          <SelectedImages files={files} setFiles={setFiles} />

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
              {/* Image picker trigger (no previews here) */}
              <ImagePicker
                files={files}
                setFiles={setFiles}
                maxFiles={maxFiles}
                existingImagesCount={existingImages.length}
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
