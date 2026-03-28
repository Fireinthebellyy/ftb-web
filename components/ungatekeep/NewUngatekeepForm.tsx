"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import { FileItem } from "@/types/interfaces";
import {
  deleteStorageObjectClient,
  uploadFileViaSignedUrl,
} from "@/lib/storage/client";
import {
  UnifiedFilePicker,
  ExistingAttachments,
  UnifiedFilesPreview,
} from "@/components/opportunity/images/ImageDropzone";
import { SchedulePublishPopover } from "@/components/opportunity/fields/MetaPopovers";
import { toDateTimeLocalValue } from "@/lib/date-utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["link"],
    ["clean"],
  ],
};

const ungatekeepFormSchema = z.object({
  content: z.string().min(10, {
    message: "Content must be at least 10 characters.",
  }),
  linkUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  linkTitle: z.string().optional(),
  linkImage: z.string().url("Invalid image URL").optional().or(z.literal("")),
  videoUrl: z
    .string()
    .regex(
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
      "Invalid YouTube URL"
    )
    .optional()
    .or(z.literal("")),
  tag: z.enum([
    "announcement",
    "company_experience",
    "resources",
    "playbooks",
    "college_hacks",
    "interview",
    "ama_drops",
    "ftb_recommends",
  ]).optional(),
  isPinned: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  publishAt: z
    .string()
    .optional()
    .refine(
      (value) =>
        !value ||
        (value.length > 0 && !Number.isNaN(new Date(value).getTime())),
      {
        message: "Please provide a valid publish date and time.",
      }
    ),
  attachments: z.array(z.string()).optional(),
});

type UngatekeepFormValues = z.infer<typeof ungatekeepFormSchema>;

interface NewUngatekeepFormProps {
  children?: React.ReactNode;
  post?: {
    id: string;
    content: string;
    images?: string[];
    attachments?: string[];
    linkUrl?: string | null;
    linkTitle?: string | null;
    linkImage?: string | null;
    videoUrl?: string | null;
    tag?: string | null;
    isPinned?: boolean;
    isPublished?: boolean;
    publishedAt?: string | null;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
  isEdit?: boolean;
}

export default function NewUngatekeepForm({
  children,
  post,
  onSuccess,
  onCancel,
  isEdit = false,
}: NewUngatekeepFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<FileItem[]>([]);
  const [existingFiles, setExistingFiles] = useState<string[]>([
    ...(post?.images || []),
    ...(post?.attachments || []),
  ]);
  const [removedFileIds, setRemovedFileIds] = useState<string[]>([]);
  const [scheduleMessage, setScheduleMessage] = useState<string | null>(null);

  const maxFiles = 10;
  const maxAttachments = 2;

  const form = useForm<UngatekeepFormValues>({
    resolver: zodResolver(ungatekeepFormSchema),
    defaultValues: {
      content: post?.content || "",
      linkUrl: post?.linkUrl || "",
      linkTitle: post?.linkTitle || "",
      linkImage: post?.linkImage || "",
      videoUrl: post?.videoUrl || "",
      tag:
        (post?.tag as
          | "announcement"
          | "company_experience"
          | "resources"
          | "playbooks"
          | "college_hacks"
          | "interview"
          | "ama_drops"
          | "ftb_recommends") || undefined,
      isPinned: post?.isPinned || false,
      isPublished: post?.isPublished || false,
      publishAt: post?.publishedAt
        ? toDateTimeLocalValue(new Date(post.publishedAt))
        : "",
      attachments: post?.attachments || [],
    },
  });

  const watchedPublishAt = form.watch("publishAt");

  // Handle removing an existing file
  const handleRemoveExistingFile = (fileId: string) => {
    setExistingFiles((prev) => prev.filter((id) => id !== fileId));
    setRemovedFileIds((prev) => [...prev, fileId]);
  };

  // Delete removed files from storage
  async function deleteRemovedFiles(): Promise<void> {
    if (removedFileIds.length === 0) return;

    for (const fileId of removedFileIds) {
      try {
        await deleteStorageObjectClient("ungatekeep-images", fileId);
      } catch (err) {
        console.error(`Failed to delete file ${fileId}:`, err);
        // Continue deleting other files even if one fails
      }
    }
  }

  async function uploadFiles(): Promise<{
    attachmentIds: string[];
    success: boolean;
  }> {
    if (files.length === 0 && attachmentFiles.length === 0)
      return { attachmentIds: [], success: true };

    const uploadedFileIds: string[] = [];
    let hasError = false;

    setFiles((prev) =>
      prev.map((file) => ({ ...file, uploading: true, progress: 0 }))
    );
    setAttachmentFiles((prev) =>
      prev.map((file) => ({ ...file, uploading: true, progress: 0 }))
    );

    const allNewFiles = [...files, ...attachmentFiles].sort(
      (a, b) => (a.addedAt || 0) - (b.addedAt || 0)
    );

    for (const fileItem of allNewFiles) {
      const isImage = fileItem.kind === "image";
      try {
        const uploaded = await uploadFileViaSignedUrl({
          domain: "ungatekeep-images",
          file: fileItem.file,
          onProgress: (progress) => {
            const percent = Math.round(progress || 0);
            if (isImage) {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === fileItem.id ? { ...f, progress: percent } : f
                )
              );
            } else {
              setAttachmentFiles((prev) =>
                prev.map((f) =>
                  f.id === fileItem.id ? { ...f, progress: percent } : f
                )
              );
            }
          },
        });

        uploadedFileIds.push(uploaded.key);
        if (isImage) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id
                ? { ...f, uploading: false, fileId: uploaded.key }
                : f
            )
          );
        } else {
          setAttachmentFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id
                ? { ...f, uploading: false, fileId: uploaded.key }
                : f
            )
          );
        }
      } catch (err) {
        console.error(`Upload failed for ${fileItem.name}:`, err);
        hasError = true;
        if (isImage) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id
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
        } else {
          setAttachmentFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id
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
        }
        const message =
          err instanceof Error ? err.message : "Unknown upload error";
        toast.error(`Failed to upload "${fileItem.name}": ${message}`);
      }
    }

    return { attachmentIds: uploadedFileIds, success: !hasError };
  }

  async function onSubmit(data: UngatekeepFormValues) {
    try {
      setIsSubmitting(true);

      const { attachmentIds, success: filesOk } = await uploadFiles();

      if (!filesOk) {
        toast.error(
          `One or more files failed to upload. Fix the failed uploads and try again. ${post ? "Post was not updated." : "Post was not created."}`
        );
        throw new Error(
          "One or more files failed to upload. Post was not updated/created."
        );
      }

      // Combine existing and new files into one attachments array
      const finalAttachments = [...existingFiles, ...attachmentIds];

      const cleanedData = {
        ...data,
        isPublished: data.publishAt ? true : data.isPublished,
        attachments:
          isEdit && post
            ? finalAttachments
            : finalAttachments.length > 0
              ? finalAttachments
              : undefined,
        linkUrl: data.linkUrl || undefined,
        linkTitle: data.linkTitle || undefined,
        linkImage: data.linkImage || undefined,
        videoUrl: data.videoUrl || undefined,
        tag: data.tag || undefined,
        publishAt: data.publishAt || undefined,
      };

      if (isEdit && post) {
        const response = await axios.put(
          `/api/admin/ungatekeep/${post.id}`,
          cleanedData
        );
        if (response.status === 200) {
          // Delete removed files from Appwrite storage after successful update
          await deleteRemovedFiles();
          toast.success("Post updated successfully!");
          setOpen(false);
          form.reset();
          files.forEach((file) => URL.revokeObjectURL(file.preview));
          setFiles([]);
          setAttachmentFiles([]);
          setRemovedFileIds([]);
          onSuccess?.();
        }
      } else {
        const response = await axios.post("/api/admin/ungatekeep", cleanedData);
        if (response.status === 201) {
          toast.success("Post created successfully!");
          setOpen(false);
          form.reset();
          files.forEach((file) => URL.revokeObjectURL(file.preview));
          setFiles([]);
          setAttachmentFiles([]);
          onSuccess?.();
        }
      }
    } catch (error) {
      console.error("Error saving post:", error);
      if (error instanceof Error && error.message.includes("images failed")) {
        // Error already shown
      } else {
        toast.error(
          `Failed to ${isEdit ? "update" : "create"} post. Please try again.`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const formContent = (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex max-h-[calc(90vh-10rem)] flex-col"
      >
        <div className="space-y-4 overflow-y-auto pr-1 pb-4">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content *</FormLabel>
                <FormControl>
                  <div className="[&_div.ql-container]:min-h-[160px] [&_div.ql-editor]:max-h-[30vh] [&_div.ql-editor]:min-h-[160px] [&_div.ql-editor]:overflow-y-auto">
                    <ReactQuill
                      theme="snow"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      modules={quillModules}
                      placeholder="Write your post content..."
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tag"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tag</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tag (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="company_experience">
                      Company Experience
                    </SelectItem>
                    <SelectItem value="resources">Resources</SelectItem>
                    <SelectItem value="playbooks">Playbooks</SelectItem>
                    <SelectItem value="college_hacks">College Hacks</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="ama_drops">AMA Drops</SelectItem>
                    <SelectItem value="ftb_recommends">
                      FTB Recommends
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Upload Section (LinkedIn style below tags) */}
          <div className="flex flex-col gap-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <FormLabel>Uploads (Optional)</FormLabel>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-muted-foreground text-[10px]">
                  {files.length + existingFiles.filter(f => !f.toLowerCase().endsWith('.pdf') && !f.toLowerCase().endsWith('.ppt') && !f.toLowerCase().endsWith('.pptx')).length} / {maxFiles} images
                </span>
                <span className="text-muted-foreground text-[10px]">
                  {attachmentFiles.length + existingFiles.filter(f => f.toLowerCase().endsWith('.pdf') || f.toLowerCase().endsWith('.ppt') || f.toLowerCase().endsWith('.pptx')).length} / {maxAttachments} documents
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <UnifiedFilePicker
                imageFiles={files}
                setImageFiles={setFiles}
                maxImageFiles={maxFiles}
                existingImagesCount={
                  existingFiles.filter(
                    (f) =>
                      !f.toLowerCase().endsWith(".pdf") &&
                      !f.toLowerCase().endsWith(".ppt") &&
                      !f.toLowerCase().endsWith(".pptx")
                  ).length
                }
                attachmentFiles={attachmentFiles}
                setAttachmentFiles={setAttachmentFiles}
                maxAttachmentFiles={maxAttachments}
                existingAttachmentsCount={
                  existingFiles.filter(
                    (f) =>
                      f.toLowerCase().endsWith(".pdf") ||
                      f.toLowerCase().endsWith(".ppt") ||
                      f.toLowerCase().endsWith(".pptx")
                  ).length
                }
                showLabel
                label="Upload files"
                compactLabel="Upload files"
                className="w-full"
                buttonClassName="w-full flex-row justify-center gap-2 h-12 px-4 bg-muted/30 hover:bg-muted/50 border-dashed border-2 text-sm md:text-sm md:w-full"
              />
            </div>

            {/* Previews */}
            {isEdit && post && (
              <ExistingAttachments
                existingAttachments={existingFiles}
                onRemoveExisting={handleRemoveExistingFile}
                loading={isSubmitting}
              />
            )}
            <UnifiedFilesPreview
              files={files}
              setFiles={setFiles}
              attachmentFiles={attachmentFiles}
              setAttachmentFiles={setAttachmentFiles}
              loading={isSubmitting}
            />
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-medium">Link & Video (Optional)</h3>
            <FormField
              control={form.control}
              name="videoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube Video URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://www.youtube.com/watch?v=..."
                      {...field}
                    />
                  </FormControl>
                  <div className="text-muted-foreground text-[10px]">
                    Enter a YouTube URL to embed a video in the post
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linkUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linkTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Link preview title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linkImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link Image URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4 border-t pt-4">
            <FormField
              control={form.control}
              name="isPinned"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Pin Post</FormLabel>
                    <div className="text-muted-foreground text-sm">
                      Pinned posts appear at the top of the feed
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Publish</FormLabel>
                    <div className="text-muted-foreground text-sm">
                      Published posts are visible to all users
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col border-t pt-4">
          <div className="flex items-center justify-end space-x-2">
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
                onClick={() => {
                  setOpen(false);
                  onCancel();
                }}
                disabled={isSubmitting}
                size="sm"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              size="sm"
              className="px-6"
            >
              {isSubmitting
                ? isEdit
                  ? "Updating..."
                  : "Creating..."
                : isEdit
                  ? "Update Post"
                  : "Create Post"}
            </Button>
          </div>
          {scheduleMessage && (
            <p className="text-muted-foreground pt-2 text-right text-xs">
              This will go live on {scheduleMessage}.
            </p>
          )}
        </div>
      </form>
    </Form>
  );

  if (isEdit) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {children && <DialogTrigger asChild>{children}</DialogTrigger>}
        <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
