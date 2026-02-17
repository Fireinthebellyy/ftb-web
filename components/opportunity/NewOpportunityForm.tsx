"use client";

import axios from "axios";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  createOpportunityStorage,
  getAppwriteErrorMessage,
} from "@/lib/appwrite";
import { toDateTimeLocalValue } from "@/lib/date-utils";
import { TitleField } from "./fields/TitleField";
import { DescriptionField } from "./fields/DescriptionField";
import { TagsField } from "./fields/TagsField";
import { TypeSelector } from "./fields/TypeSelector";
import { MetaPopovers, SchedulePublishPopover } from "./fields/MetaPopovers";
import {
  ImagePicker,
  SelectedImages,
  ExistingImages,
} from "./images/ImageDropzone";
import { formSchema, FormData } from "./schema";
import { FileItem, Opportunity, UploadProgress } from "@/types/interfaces";
import { useQueryClient } from "@tanstack/react-query";

export default function NewOpportunityForm({
  opportunity,
  onOpportunityCreated,
  onCancel,
}: {
  opportunity?: Opportunity;
  onOpportunityCreated: () => void;
  onCancel?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState<string | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>(
    opportunity?.images || []
  );
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const maxFiles = 4;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      type: opportunity?.type || "",
      title: opportunity?.title || "",
      description: opportunity?.description || "",
      tags: opportunity?.tags?.join(", ") || "",
      location: opportunity?.location || "",
      organiserInfo: opportunity?.organiserInfo || "",
      dateRange: undefined,
      publishAt: toDateTimeLocalValue(opportunity?.publishAt),
    },
  });

  const watchedType = form.watch("type");
  const watchedLocation = form.watch("location");
  const watchedOrganiser = form.watch("organiserInfo");
  const watchedDateRange = form.watch("dateRange");
  const watchedTitle = form.watch("title");
  const watchedDescription = form.watch("description");
  const watchedTags = form.watch("tags");
  const watchedPublishAt = form.watch("publishAt");

  useEffect(() => {
    // Set initial date range if available
    if (opportunity?.startDate || opportunity?.endDate) {
      form.setValue("dateRange", {
        from: opportunity.startDate
          ? new Date(opportunity.startDate)
          : undefined,
        to: opportunity.endDate ? new Date(opportunity.endDate) : undefined,
      });
    }

    form.setValue("publishAt", toDateTimeLocalValue(opportunity?.publishAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunity]);

  useEffect(() => {
    // Only run change detection when editing an existing opportunity
    if (!opportunity) {
      // Creating new opportunity -> enable submit when form is dirty or images present
      setHasChanges(form.formState.isDirty || files.length > 0);
      return;
    }

    const currentSnapshot = JSON.stringify({
      type: watchedType || "",
      title: watchedTitle || "",
      description: watchedDescription || "",
      tags: watchedTags || "",
      location: watchedLocation || "",
      organiserInfo: watchedOrganiser || "",
      dateRange: {
        from: watchedDateRange?.from
          ? watchedDateRange.from.toISOString()
          : null,
        to: watchedDateRange?.to ? watchedDateRange.to.toISOString() : null,
      },
      publishAt: watchedPublishAt || "",
    });

    const originalSnapshot = JSON.stringify({
      type: opportunity.type || "",
      title: opportunity.title || "",
      description: opportunity.description || "",
      tags: (opportunity.tags || []).join(", "),
      location: opportunity.location || "",
      organiserInfo: opportunity.organiserInfo || "",
      dateRange: {
        from: opportunity.startDate
          ? new Date(opportunity.startDate).toISOString()
          : null,
        to: opportunity.endDate
          ? new Date(opportunity.endDate).toISOString()
          : null,
      },
      publishAt: toDateTimeLocalValue(opportunity.publishAt),
    });

    // Check if images have changed (either new files added or existing images removed)
    const originalImages = opportunity.images || [];
    const imagesChanged =
      files.length > 0 ||
      existingImages.length !== originalImages.length ||
      !existingImages.every((img) => originalImages.includes(img));

    setHasChanges(currentSnapshot !== originalSnapshot || imagesChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    opportunity,
    watchedType,
    watchedTitle,
    watchedDescription,
    watchedTags,
    watchedPublishAt,
    watchedLocation,
    watchedOrganiser,
    watchedDateRange,
    files,
    existingImages,
  ]);

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
        const errorMessage = getAppwriteErrorMessage(err);
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  uploading: false,
                  error: true,
                  errorMessage,
                }
              : f
          )
        );
        toast.error(`Failed to upload "${file.name}": ${errorMessage}`);
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
          `One or more images failed to upload. Fix the failed uploads and try again. ${opportunity ? "Post was not updated." : "Post was not created."}`
        );
        throw new Error(
          "One or more images failed to upload. Post was not updated/created."
        );
      }

      // Combine existing images with newly uploaded images
      const finalImages = [...existingImages, ...imageIds];

      let normalizedPublishAt: string | null | undefined;
      if (data.publishAt && data.publishAt.trim().length > 0) {
        const parsedPublishAt = new Date(data.publishAt);
        normalizedPublishAt = Number.isNaN(parsedPublishAt.getTime())
          ? opportunity?.publishAt
            ? null
            : undefined
          : parsedPublishAt.toISOString();
      } else {
        normalizedPublishAt = opportunity?.publishAt ? null : undefined;
      }

      const payload = {
        ...data,
        startDate: data.dateRange?.from?.toISOString(),
        endDate: data.dateRange?.to?.toISOString(),
        tags:
          data.tags
            ?.split(",")
            .map((t) => t.trim())
            .filter(Boolean) || [],
        // For edit mode: always send the final images array (existing + new)
        // For create mode: only send if there are images
        images: opportunity?.id
          ? finalImages
          : imageIds.length > 0
            ? imageIds
            : undefined,
        ...(normalizedPublishAt !== undefined
          ? { publishAt: normalizedPublishAt }
          : {}),
      };

      let res;
      if (opportunity?.id) {
        res = await axios.put(`/api/opportunities/${opportunity.id}`, payload);
        if (res.status !== 200) throw new Error("Failed to update opportunity");

        // Delete removed images from Appwrite storage after successful update
        await deleteRemovedImages();
      } else {
        res = await axios.post("/api/opportunities", payload);
        if (res.status !== 200 && res.status !== 201)
          throw new Error("Failed to create opportunity");
      }

      files.forEach((file) => URL.revokeObjectURL(file.preview));
      setFiles([]);
      setRemovedImageIds([]);

      // Check user role to show appropriate message
      const userRole = res.data?.userRole || "user"; // The API should return user role
      const needsReview = userRole === "user";
      const isScheduled =
        typeof payload.publishAt === "string" &&
        new Date(payload.publishAt).getTime() > Date.now();

      toast.success(
        opportunity?.id
          ? "Opportunity updated successfully!"
          : needsReview
            ? "Opportunity submitted for review! It will be visible once approved by an admin."
            : isScheduled
              ? "Opportunity scheduled successfully!"
              : "Opportunity submitted successfully!"
      );
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      onOpportunityCreated();
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
          {opportunity && (
            <ExistingImages
              existingImages={existingImages}
              onRemoveExisting={handleRemoveExistingImage}
            />
          )}

          {/* Selected new images displayed above the bottom action bar */}
          <SelectedImages files={files} setFiles={setFiles} />

          <TagsField control={form.control} />

          <TypeSelector
            control={form.control}
            value={watchedType}
            onChange={handleTypeChange}
          />

          {/* Bottom Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2 md:gap-4">
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
              <SchedulePublishPopover
                control={form.control}
                watchedPublishAt={watchedPublishAt}
                onConfirmMessageChange={setScheduleMessage}
              />
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                  size="sm"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                variant="default"
                disabled={loading || (opportunity ? !hasChanges : false)}
                size="sm"
                className="px-6"
              >
                {loading
                  ? opportunity
                    ? "Updating..."
                    : "Posting..."
                  : opportunity
                    ? "Update"
                    : "Post"}
              </Button>
            </div>

            {scheduleMessage && (
              <p className="text-muted-foreground w-full pt-1 text-right text-xs">
                This will go live on {scheduleMessage}.
              </p>
            )}
          </div>
        </form>
      </Form>
    </FormProvider>
  );
}
