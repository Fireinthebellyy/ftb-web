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
  UnifiedFilePicker,
  SelectedImages,
  ExistingImages,
  SelectedAttachments,
  ExistingAttachments,
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
  const [attachmentFiles, setAttachmentFiles] = useState<FileItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>(
    opportunity?.images || []
  );
  const [existingAttachments, setExistingAttachments] = useState<string[]>(
    opportunity?.attachments || []
  );
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>(
    []
  );

  const { onSubmit, loading } = useOpportunitySubmit({
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
  });

  const maxFiles = 10;
  const maxAttachments = 2;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      type: opportunity?.type || "",
      title: opportunity?.title || "",
      description: opportunity?.description || "",
      tags: opportunity?.tags?.join("|") || "",
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
    if (!opportunity) {
      setHasChanges(
        form.formState.isDirty || files.length > 0 || attachmentFiles.length > 0
      );
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
      tags: (opportunity.tags || []).join("|"),
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

    const originalImages = opportunity.images || [];
    const imagesChanged =
      files.length > 0 ||
      existingImages.length !== originalImages.length ||
      !existingImages.every((img) => originalImages.includes(img));

    const originalAttachments = opportunity.attachments || [];
    const attachmentsChanged =
      attachmentFiles.length > 0 ||
      existingAttachments.length !== originalAttachments.length ||
      !existingAttachments.every((a) => originalAttachments.includes(a));

    setHasChanges(
      currentSnapshot !== originalSnapshot ||
        imagesChanged ||
        attachmentsChanged
    );
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
    attachmentFiles,
    existingAttachments,
  ]);

  const handleRemoveExistingImage = (imageId: string) => {
    setExistingImages((prev) => prev.filter((id) => id !== imageId));
    setRemovedImageIds((prev) => [...prev, imageId]);
  };

  const handleRemoveExistingAttachment = (attachmentId: string) => {
    setExistingAttachments((prev) => prev.filter((id) => id !== attachmentId));
    setRemovedAttachmentIds((prev) => [...prev, attachmentId]);
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

          {opportunity && (
            <ExistingImages
              existingImages={existingImages}
              onRemoveExisting={handleRemoveExistingImage}
            />
          )}

          <SelectedImages files={files} setFiles={setFiles} />

          {opportunity && (
            <ExistingAttachments
              existingAttachments={existingAttachments}
              onRemoveExisting={handleRemoveExistingAttachment}
            />
          )}

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
          <div className="space-y-1 pt-2">
            <div className="flex flex-wrap items-end justify-between gap-2 pb-1 min-[412px]:flex-nowrap">
              <div className="flex items-center gap-1.5 md:gap-2.5 min-[412px]:shrink-0">
                <MetaPopovers
                  control={form.control}
                  watchedLocation={watchedLocation}
                  watchedOrganiser={watchedOrganiser}
                  watchedDateRange={watchedDateRange}
                  showSchedule={false}
                  showLabels
                  compactLabels
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
                  showLabel
                  label="Uploads"
                  compactLabel="UPLD"
                />
              </div>

              <div className="ml-auto flex w-full flex-nowrap items-end justify-end gap-1.5 sm:gap-2 min-[412px]:w-auto min-[412px]:shrink-0">
                <SchedulePublishPopover
                  control={form.control}
                  watchedPublishAt={watchedPublishAt}
                  onConfirmMessageChange={setScheduleMessage}
                  showLabel
                  label="Schedule"
                  compactLabel="SCHD"
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
