"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toDateTimeLocalValue } from "@/lib/date-utils";
import { useOpportunitySubmit } from "./hooks/useOpportunitySubmit";
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
import { FileItem, Opportunity } from "@/types/interfaces";

export default function NewOpportunityForm({
  opportunity,
  onOpportunityCreated,
  onCancel,
}: {
  opportunity?: Opportunity;
  onOpportunityCreated: () => void;
  onCancel?: () => void;
}) {
  const [scheduleMessage, setScheduleMessage] = useState<string | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>(
    opportunity?.images || []
  );
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);

  const { onSubmit, loading } = useOpportunitySubmit({
    opportunity,
    files,
    setFiles,
    existingImages,
    onOpportunityCreated,
    setRemovedImageIds,
    removedImageIds
  });


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

  function handleTypeChange(type: string) {
    form.setValue("type", type, { shouldValidate: true, shouldTouch: true });
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
                watchedPublishAt={watchedPublishAt}
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
