"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import axios from "axios";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
import { ToolkitImageInput } from "@/components/admin/ToolkitImageInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteStorageObjectClient,
  uploadFileViaSignedUrl,
} from "@/lib/storage/client";

const CATEGORIES = [
  "Career",
  "Skills",
  "Interview Prep",
  "Resume",
  "Salary Negotiation",
  "LinkedIn",
  "Networking",
];

const toolkitFormSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  price: z.coerce.number().min(0, {
    message: "Price must be a positive number.",
  }),
  originalPrice: z.coerce.number().min(0).optional(),
  category: z.string().optional(),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  bannerImageUrl: z.string().url().optional().or(z.literal("")),
  videoUrl: z.string().url().optional().or(z.literal("")),
  totalDuration: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  testimonials: z
    .array(
      z.object({
        name: z.string(),
        role: z.string(),
        message: z.string().min(1, "Message is required"),
      })
    )
    .optional(),
});

type ToolkitFormValues = z.infer<typeof toolkitFormSchema>;

function formatHighlight(highlight: string) {
  const trimmed = highlight.trim();

  if (!trimmed) {
    return "";
  }

  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

interface NewToolkitModalProps {
  children: React.ReactNode;
  onSuccess?: () => void;
}

export default function NewToolkitModal({
  children,
  onSuccess,
}: NewToolkitModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);

  const form = useForm<ToolkitFormValues>({
    resolver: zodResolver(toolkitFormSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      originalPrice: undefined,
      category: "",
      coverImageUrl: "",
      bannerImageUrl: "",
      videoUrl: "",
      totalDuration: "",
      highlights: [],
      testimonials: [],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "testimonials",
  });

  async function onSubmit(data: ToolkitFormValues) {
    const existingCoverUrl = data.coverImageUrl?.trim() ?? "";
    if (!existingCoverUrl && !coverImageFile) {
      form.setError("coverImageUrl", {
        type: "manual",
        message: "Cover image is required",
      });
      return;
    }

    const uploadedKeys: string[] = [];

    try {
      setIsSubmitting(true);

      let coverImageUrl = existingCoverUrl || undefined;
      let bannerImageUrl = data.bannerImageUrl?.trim() || undefined;

      if (coverImageFile) {
        const uploadedCover = await uploadFileViaSignedUrl({
          domain: "ungatekeep-images",
          file: coverImageFile,
        });
        coverImageUrl = uploadedCover.publicUrl;
        uploadedKeys.push(uploadedCover.key);
      }

      if (bannerImageFile) {
        const uploadedBanner = await uploadFileViaSignedUrl({
          domain: "ungatekeep-images",
          file: bannerImageFile,
        });
        bannerImageUrl = uploadedBanner.publicUrl;
        uploadedKeys.push(uploadedBanner.key);
      }

      const cleanedData = {
        ...data,
        coverImageUrl,
        bannerImageUrl,
        videoUrl: data.videoUrl || undefined,
        category: data.category || undefined,
        totalDuration: data.totalDuration || undefined,
        highlights:
          data.highlights?.map(formatHighlight).filter(Boolean) || undefined,
        testimonials: data.testimonials?.length
          ? data.testimonials.map((item) => ({
              name: item.name.trim(),
              role: item.role.trim(),
              message: item.message.trim(),
            }))
          : undefined,
      };

      const response = await axios.post("/api/toolkits", cleanedData);

      if (response.status === 201) {
        toast.success("Toolkit created successfully!");
        setOpen(false);
        form.reset();
        setCoverImageFile(null);
        setBannerImageFile(null);
        onSuccess?.();
      }
    } catch (error) {
      await Promise.all(
        uploadedKeys.map((key) =>
          deleteStorageObjectClient("ungatekeep-images", key).catch(() => null)
        )
      );
      console.error("Error creating toolkit:", error);
      toast.error("Failed to create toolkit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset();
      setCoverImageFile(null);
      setBannerImageFile(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Toolkit</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter toolkit title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter detailed description"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (₹) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="299"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="originalPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Price (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="999"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Duration</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2h 30m" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="coverImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Image *</FormLabel>
                  <FormControl>
                    <ToolkitImageInput
                      label="Cover image"
                      imageUrl={field.value ?? ""}
                      selectedFile={coverImageFile}
                      onFileSelect={setCoverImageFile}
                      onRemove={() => {
                        setCoverImageFile(null);
                        field.onChange("");
                      }}
                      disabled={isSubmitting}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bannerImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner Image (HD, optional)</FormLabel>
                  <FormControl>
                    <ToolkitImageInput
                      label="Banner image"
                      imageUrl={field.value ?? ""}
                      selectedFile={bannerImageFile}
                      onFileSelect={setBannerImageFile}
                      onRemove={() => {
                        setBannerImageFile(null);
                        field.onChange("");
                      }}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Testimonials</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ name: "", role: "", message: "" })}
                  disabled={isSubmitting}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add testimonial
                </Button>
              </div>

              {fields.map((item, index) => (
                <div key={item.id} className="space-y-3 rounded-lg border p-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`testimonials.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Aditi Sharma" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`testimonials.${index}.role`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Final Year Student"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`testimonials.${index}.message`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Share the learner outcome"
                            className="min-h-[90px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="videoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube Promo Video URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://youtube.com/embed/..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="highlights"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Highlights (comma-separated)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Lifetime access, Downloadable resources, Certificate"
                      {...field}
                      value={field.value?.join(", ") ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value.split(","))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Toolkit"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
