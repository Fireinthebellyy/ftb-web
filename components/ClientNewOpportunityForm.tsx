"use client";

import axios from "axios";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { storage } from "@/lib/appwrite";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

type UploadProgress = {
  progress: number;
};

import {
  CalendarIcon,
  MapPin,
  Building2,
  Hash,
  Tags,
  X,
  Image as ImageIcon,
  Flag,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import Image from "next/image";

const opportunityTypes = [
  { id: "hackathon", label: "Hackathon" },
  { id: "grant", label: "Grant" },
  { id: "competition", label: "Competition" },
  { id: "ideathon", label: "Ideathon" },
];

interface FileItem {
  name: string;
  size: number;
  file: File;
  preview: string;
  uploading?: boolean;
  progress?: number;
  fileId?: string;
  error?: boolean;
}

const formSchema = z.object({
  type: z.string().min(1, {
    message: "Please select an opportunity type.",
  }),
  title: z
    .string()
    .min(4, {
      message: "Title must be at least 4 characters.",
    })
    .max(100, {
      message: "Title must not exceed 100 characters.",
    }),
  description: z
    .string()
    .min(10, {
      message: "Description must be at least 10 characters.",
    })
    .max(2000, {
      message: "Description must not exceed 2000 characters.",
    }),
  tags: z.string().optional(),
  location: z.string().optional(),
  organiserInfo: z.string().optional(),
  dateRange: z
    .object({
      from: z.date().optional(),
      to: z.date().optional(),
    })
    .optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function ClientNewOpportunityForm({
  onOpportunityCreated,
}: {
  onOpportunityCreated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);

  const maxFiles = 4;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      type: "",
      title: "",
      description: "",
      tags: "",
      location: "",
      organiserInfo: "",
      dateRange: undefined,
    },
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const remainingSlots = maxFiles - files.length;
      if (remainingSlots <= 0) return;

      const filesToAdd = acceptedFiles.slice(0, remainingSlots);

      const newFiles: FileItem[] = filesToAdd.map((file) => ({
        name: file.name,
        size: file.size,
        file,
        preview: URL.createObjectURL(file),
      }));

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files.length]
  );

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const {
    getRootProps,
    getInputProps,
    isDragActive: _isDragActive,
  } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    multiple: true,
    maxFiles: maxFiles - files.length,
    maxSize: 5 * 1024 * 1024,
    noClick: files.length >= maxFiles,
  });

  function handleTypeChange(type: string) {
    form.setValue("type", type, { shouldValidate: true, shouldTouch: true });
  }

  async function uploadImages(): Promise<string[]> {
    if (files.length === 0) return [];

    const uploadedFileIds: string[] = [];
    setFiles((prev) =>
      prev.map((file) => ({ ...file, uploading: true, progress: 0 }))
    );

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const res = await storage.createFile(
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
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, uploading: false, error: true } : f
          )
        );
        toast.error(`Failed to upload: ${file.name}`);
      }
    }

    return uploadedFileIds;
  }

  async function onSubmit(data: FormData) {
    setLoading(true);

    try {
      const imageIds = await uploadImages();

      const res = await axios.post("/api/opportunities", {
        ...data,
        startDate: data.dateRange?.from?.toISOString(),
        endDate: data.dateRange?.to?.toISOString(),
        tags:
          data.tags
            ?.split(",")
            .map((t) => t.trim())
            .filter(Boolean) || [],
        images: imageIds,
      });

      if (res.status !== 200 && res.status !== 201)
        throw new Error("Failed to create opportunity");

      files.forEach((file) => URL.revokeObjectURL(file.preview));
      setFiles([]);

      toast.success("Opportunity created successfully!");
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

  const watchedType = form.watch("type");
  const watchedLocation = form.watch("location");
  const watchedOrganiser = form.watch("organiserInfo");
  const watchedDateRange = form.watch("dateRange");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-1">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  placeholder="What's the opportunity about? *"
                  className="text-xl md:text-xl font-medium border-none px-0 focus-visible:ring-0 placeholder:text-gray-400 shadow-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Tell us more about this opportunity... (include URLs if needed) *"
                  rows={4}
                  className="resize-none border-none px-0 focus-visible:ring-0 placeholder:text-gray-400 shadow-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Small Image Previews Inside Container */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 py-2">
            {files.map((file, idx) => (
              <div key={idx} className="relative group">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border">
                  <Image
                    src={file.preview}
                    alt={file.name}
                    className="w-full h-full object-cover"
                    width={64}
                    height={64}
                  />
                  {file.uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-xs">{file.progress}%</div>
                    </div>
                  )}
                  {file.error && (
                    <div className="absolute inset-0 bg-red-500 bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-xs">!</div>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 rounded-full "
                  onClick={() => removeFile(idx)}
                >
                  <X className="w-2 h-2" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Tags Row */}
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex items-center gap-2 pt-2">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <Input
                    {...field}
                    placeholder="Add tags (ai, blockchain, web3...)"
                    className="border-none px-0 focus-visible:ring-0 placeholder:text-gray-400 text-sm shadow-none"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Type selection */}
        <FormField
          control={form.control}
          name="type"
          render={() => (
            <FormItem>
              <FormControl>
                <div className="pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Tags
                      className="w-3.5 h-3.5 text-gray-400"
                      aria-hidden="true"
                    />
                    <span className="text-xs font-medium text-gray-400">
                      Opportunity type
                      <span className="ml-0.5">*</span>
                    </span>
                  </div>

                  <div
                    className="flex items-center gap-1 flex-wrap"
                    role="radiogroup"
                    aria-label="Opportunity type"
                  >
                    {opportunityTypes.map((type) => {
                      // Unified selected color style for all badges
                      const selectedClass =
                        "bg-blue-100 text-blue-800 hover:bg-blue-200";

                      return (
                        <Badge
                          key={type.id}
                          variant={
                            watchedType === type.id ? "default" : "outline"
                          }
                          className={cn(
                            "text-xs cursor-pointer transition-all px-2 py-0.5 h-auto",
                            watchedType === type.id
                              ? `${selectedClass} border-transparent`
                              : "bg-gray-50 text-gray-500 hover:bg-gray-100 border-gray-200"
                          )}
                          onClick={() => handleTypeChange(type.id)}
                          role="radio"
                          aria-checked={watchedType === type.id}
                        >
                          {type.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4">
            {/* Location */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "p-2 h-8 w-8",
                    watchedLocation && "text-blue-600 bg-blue-50"
                  )}
                >
                  <MapPin className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Location
                          </label>
                          <Input
                            {...field}
                            placeholder="City, Country"
                            className="text-sm"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </PopoverContent>
            </Popover>

            {/* Organizer */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "p-2 h-8 w-8",
                    watchedOrganiser && "text-blue-600 bg-blue-50"
                  )}
                >
                  <Building2 className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <FormField
                  control={form.control}
                  name="organiserInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Organizer
                          </label>
                          <Input
                            {...field}
                            placeholder="Company or Organization"
                            className="text-sm"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </PopoverContent>
            </Popover>

            {/* Calendar with Date Range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "p-2 h-8 w-8",
                    watchedDateRange && "text-blue-600 bg-blue-50"
                  )}
                >
                  <CalendarIcon className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <FormField
                  control={form.control}
                  name="dateRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div>
                          <Calendar
                            mode="range"
                            selected={field.value as DateRange}
                            onSelect={field.onChange}
                            captionLayout={"dropdown-months"}
                            numberOfMonths={1}
                          />
                          {field.value?.from && (
                            <div className="p-3 border-t">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Selected Dates
                                  {field.value.to && (
                                    <span className="text-xs ml-1">
                                      (
                                      {Math.ceil(
                                        (field.value.to.getTime() -
                                          field.value.from.getTime()) /
                                          (1000 * 60 * 60 * 24)
                                      ) + 1}{" "}
                                      days)
                                    </span>
                                  )}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => field.onChange(undefined)}
                                  className="h-5 w-5 p-0 text-gray-400 hover:text-red-500"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-green-800 flex items-center"
                                >
                                  <CalendarIcon className="w-3 h-3 mr-1" />
                                  {format(field.value.from, "MMM dd, yyyy")}
                                </Badge>

                                {field.value.to && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-red-100 text-red-800 flex items-center"
                                  >
                                    <Flag className="w-3 h-3 mr-1" />
                                    {format(field.value.to, "MMM dd, yyyy")}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </PopoverContent>
            </Popover>

            {/* Image Upload Trigger */}
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "p-2 h-8 w-8",
                  files.length > 0 && "text-blue-600 bg-blue-50",
                  files.length >= maxFiles && "opacity-50 cursor-not-allowed"
                )}
                disabled={files.length >= maxFiles}
              >
                <ImageIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={loading} size="sm" className="px-6">
            {loading ? "Posting..." : "Post"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
