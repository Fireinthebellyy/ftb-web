"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import axios from "axios";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

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
  deleteStorageObjectClient,
  uploadFileViaSignedUrl,
} from "@/lib/storage/client";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { normalizeRichText } from "@/lib/rich-text";
import { toolkitFormSchema, ToolkitFormValues, Toolkit } from "@/components/admin/types";

function formatHighlight(highlight: string) {
  const trimmed = highlight.trim();
  if (!trimmed) return "";
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

interface NewBundleModalProps {
  children: React.ReactNode;
  onSuccess?: () => void;
}

export default function NewBundleModal({
  children,
  onSuccess,
}: NewBundleModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);

  // Fetch toolkits for the bundle item selector
  const { data: toolkits = [] } = useQuery({
    queryKey: ["admin", "toolkits"],
    queryFn: async () => {
      const res = await axios.get<Toolkit[]>("/api/admin/toolkits");
      return res.data;
    },
    enabled: open, // Only fetch when modal is open
  });

  // Filter out existing bundles so we don't nest bundles (optional, but good practice)
  const availableCourses = toolkits.filter((t) => !t.isBundle);

  const form = useForm<ToolkitFormValues>({
    resolver: zodResolver(toolkitFormSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      originalPrice: undefined,
      category: "All", // Default category for bundles as per design
      coverImageUrl: "",
      bannerImageUrl: "",
      videoUrl: "",
      totalDuration: "",
      highlights: [],
      testimonials: [],
      is_trending: false,
      isBundle: true,
      bundleItems: [],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "testimonials",
  });

  async function onSubmit(data: ToolkitFormValues) {
    if (!data.bundleItems || data.bundleItems.length === 0) {
      toast.error("Please add at least one course to the bundle.");
      return;
    }

    const uploadedKeys: string[] = [];

    try {
      setIsSubmitting(true);

      let coverImageUrl = data.coverImageUrl?.trim() || undefined;
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
        description: normalizeRichText(data.description),
        coverImageUrl,
        bannerImageUrl,
        videoUrl: data.videoUrl || undefined,
        category: data.category || "All",
        totalDuration: data.totalDuration || undefined,
        isBundle: true,
        bundleItems: data.bundleItems,
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
        toast.success("Bundle created successfully!");
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
      console.error("Error creating bundle:", error);
      toast.error("Failed to create bundle. Please try again.");
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Create New Bundle Offer</DialogTitle>
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
                    <RichTextEditor
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Enter detailed description"
                      className="[&_div.ql-container]:min-h-[160px] [&_div.ql-editor]:max-h-[28vh] [&_div.ql-editor]:min-h-[160px] [&_div.ql-editor]:overflow-y-auto"
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
                        placeholder="0"
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

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="is_trending"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value ?? false}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Trending Badge</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isBestSeller"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value ?? false}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Bestseller Badge</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isLimitedSeats"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value ?? false}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Limited Seats</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

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

            {/* Bundle Items section matching the design */}
            <FormField
              control={form.control}
              name="bundleItems"
              render={({ field }) => (
                <FormItem className="rounded-lg border p-4 bg-gray-50/50">
                  <div className="flex items-center justify-between pb-2">
                    <FormLabel className="text-base font-semibold">Bundle Items</FormLabel>
                    <select
                      className="flex h-9 w-48 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        if (selectedId && !field.value?.includes(selectedId)) {
                          field.onChange([...(field.value || []), selectedId]);
                        }
                        // Reset select visually
                        e.target.value = "";
                      }}
                      disabled={isSubmitting}
                      defaultValue=""
                    >
                      <option value="" disabled>+ Add Course to Bundle</option>
                      {availableCourses
                        .filter((course) => !field.value?.includes(course.id))
                        .map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.title}
                          </option>
                        ))}
                    </select>
                  </div>
                  <FormControl>
                    <div className="space-y-2 mt-2">
                      {field.value && field.value.length > 0 ? (
                        field.value.map((toolkitId) => {
                          const course = availableCourses.find(c => c.id === toolkitId);
                          return (
                            <div key={toolkitId} className="flex items-center justify-between bg-white p-2 rounded border text-sm">
                              <span className="font-medium">{course?.title || 'Unknown Course'}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-500"
                                onClick={() => {
                                  field.onChange(field.value?.filter(id => id !== toolkitId));
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground py-2 text-center border border-dashed rounded bg-white">
                          No courses added to this bundle yet.
                        </p>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Optional Banner/Cover image in an expander or just minimal */}
            <div className="space-y-4 pt-4 border-t">
              <FormLabel className="text-muted-foreground font-semibold">Images (Optional)</FormLabel>
              <FormField
                control={form.control}
                name="coverImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Image</FormLabel>
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isSubmitting ? "Creating..." : "Create Bundle Offer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
