"use client";

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import { FileItem, UploadProgress } from "@/types/interfaces";
import { createUngatekeepStorage, getUngatekeepBucketId } from "@/lib/appwrite";
import { ImagePicker, SelectedImages } from "@/components/opportunity/images/ImageDropzone";
import { ExistingImages as UngatekeepExistingImages } from "./ExistingImages";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const ungatekeepFormSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  content: z.string().min(10, {
    message: "Content must be at least 10 characters.",
  }),
  linkUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  linkTitle: z.string().optional(),
  linkImage: z.string().url("Invalid image URL").optional().or(z.literal("")),
  tag: z.enum(["announcement", "company_experience", "resources"]).optional(),
  isPinned: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

type UngatekeepFormValues = z.infer<typeof ungatekeepFormSchema>;

interface NewUngatekeepFormProps {
  children?: React.ReactNode;
  post?: {
    id: string;
    title: string;
    content: string;
    images?: string[];
    linkUrl?: string | null;
    linkTitle?: string | null;
    linkImage?: string | null;
    tag?: string | null;
    isPinned?: boolean;
    isPublished?: boolean;
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
  const [existingImages, setExistingImages] = useState<string[]>(
    post?.images || []
  );
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);

  const maxFiles = 4;

  const form = useForm<UngatekeepFormValues>({
    resolver: zodResolver(ungatekeepFormSchema),
    defaultValues: {
      title: post?.title || "",
      content: post?.content || "",
      linkUrl: post?.linkUrl || "",
      linkTitle: post?.linkTitle || "",
      linkImage: post?.linkImage || "",
      tag: (post?.tag as "announcement" | "company_experience" | "resources") || undefined,
      isPinned: post?.isPinned || false,
      isPublished: post?.isPublished || false,
    },
  });

  // Handle removing an existing image
  const handleRemoveExistingImage = (imageId: string) => {
    setExistingImages((prev) => prev.filter((id) => id !== imageId));
    setRemovedImageIds((prev) => [...prev, imageId]);
  };

  // Delete removed images from Appwrite storage
  async function deleteRemovedImages(): Promise<void> {
    if (removedImageIds.length === 0) return;

    const bucketId = getUngatekeepBucketId();
    if (!bucketId) return;

    const ungatekeepStorage = createUngatekeepStorage();

    for (const imageId of removedImageIds) {
      try {
        await ungatekeepStorage.deleteFile(bucketId, imageId);
      } catch (err) {
        console.error(`Failed to delete image ${imageId}:`, err);
        // Continue deleting other images even if one fails
      }
    }
  }

  async function uploadImages(): Promise<{ ids: string[]; success: boolean }> {
    if (files.length === 0) return { ids: [], success: true };

    const uploadedFileIds: string[] = [];
    let hasError = false;

    setFiles((prev) =>
      prev.map((file) => ({ ...file, uploading: true, progress: 0 }))
    );

    const bucketId = getUngatekeepBucketId();
    if (!bucketId) {
      toast.error("Image upload bucket not configured");
      return { ids: [], success: false };
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const ungatekeepStorage = createUngatekeepStorage();

        const res = await ungatekeepStorage.createFile(
          bucketId,
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

  async function onSubmit(data: UngatekeepFormValues) {
    try {
      setIsSubmitting(true);

      const { ids: imageIds, success: imagesOk } = await uploadImages();

      if (!imagesOk) {
        toast.error(
          `One or more images failed to upload. Fix the failed uploads and try again. ${post ? "Post was not updated." : "Post was not created."}`
        );
        throw new Error(
          "One or more images failed to upload. Post was not updated/created."
        );
      }

      // Combine existing images with newly uploaded images
      const finalImages = [...existingImages, ...imageIds];

      const cleanedData = {
        ...data,
        images: isEdit && post ? finalImages : imageIds.length > 0 ? imageIds : undefined,
        linkUrl: data.linkUrl || undefined,
        linkTitle: data.linkTitle || undefined,
        linkImage: data.linkImage || undefined,
        tag: data.tag || undefined,
      };

      if (isEdit && post) {
        const response = await axios.put(
          `/api/admin/ungatekeep/${post.id}`,
          cleanedData
        );
        if (response.status === 200) {
          // Delete removed images from Appwrite storage after successful update
          await deleteRemovedImages();
          toast.success("Post updated successfully!");
          setOpen(false);
          form.reset();
          files.forEach((file) => URL.revokeObjectURL(file.preview));
          setFiles([]);
          setRemovedImageIds([]);
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input placeholder="Enter post title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter post content"
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image Upload Section */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center justify-between">
            <FormLabel>Images (Optional)</FormLabel>
            <span className="text-xs text-muted-foreground">
              {files.length + existingImages.length} / {maxFiles}
            </span>
          </div>

          {/* Existing images (from post) displayed with remove option */}
          {isEdit && post && (
            <UngatekeepExistingImages
              existingImages={existingImages}
              onRemoveExisting={handleRemoveExistingImage}
            />
          )}

          {/* Selected new images displayed */}
          <SelectedImages files={files} setFiles={setFiles} />

          {/* Image picker */}
          <div className="flex items-center gap-2">
            <ImagePicker
              files={files}
              setFiles={setFiles}
              maxFiles={maxFiles}
              existingImagesCount={existingImages.length}
            />
            <span className="text-xs text-muted-foreground">
              Click to upload images (max {maxFiles})
            </span>
          </div>
        </div>

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
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-medium">Link Preview (Optional)</h3>
          <FormField
            control={form.control}
            name="linkUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://example.com"
                    {...field}
                  />
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
                  <div className="text-sm text-muted-foreground">
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
                  <div className="text-sm text-muted-foreground">
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

        <div className="flex justify-end space-x-2 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                onCancel();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isEdit
                ? "Updating..."
                : "Creating..."
              : isEdit
                ? "Update Post"
                : "Create Post"}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (isEdit) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {children && <DialogTrigger asChild>{children}</DialogTrigger>}
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
