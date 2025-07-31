"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { storage } from "@/lib/appwrite";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  MapPin,
  Building2,
  Hash,
  X,
  Image as ImageIcon,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";

const opportunityTypes = [
  { id: "hackathon", label: "Hackathon", icon: "💻" },
  { id: "grant", label: "Grant", icon: "💰" },
  { id: "competition", label: "Competition", icon: "🏆" },
  { id: "ideathon", label: "Ideathon", icon: "💡" },
];

interface FormState {
  type: string[];
  title: string;
  description: string;
  tags: string;
  location: string;
  organiserInfo: string;
  dateRange: DateRange | undefined;
}

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

export default function ClientNewOpportunityForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    type: [],
    title: "",
    description: "",
    tags: "",
    location: "",
    organiserInfo: "",
    dateRange: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);

  const maxFiles = 4;

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    multiple: true,
    maxFiles: maxFiles - files.length,
    maxSize: 5 * 1024 * 1024,
    noClick: files.length >= maxFiles,
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleTypeChange(type: string) {
    setForm((prev) => ({
      ...prev,
      type: prev.type.includes(type)
        ? prev.type.filter((t) => t !== type)
        : [...prev.type, type],
    }));
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
          (uploaded: number, total: number) => {
            const percent = Math.round((uploaded / total) * 100);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const imageIds = await uploadImages();

      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          startDate: form.dateRange?.from?.toISOString(),
          endDate: form.dateRange?.to?.toISOString(),
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          imageIds,
        }),
      });

      if (!res.ok) throw new Error("Failed to create opportunity");

      files.forEach((file) => URL.revokeObjectURL(file.preview));
      setFiles([]);

      toast.success("Opportunity created successfully!");
      router.push("/opportunities");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error");
      }
      toast.error("Failed to create opportunity");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto py-6 px-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main Content Card */}
        <Card className="shadow-sm border-2 border-gray-100 focus-within:border-blue-200 transition-colors">
          <CardContent className="p-4 space-y-4">
            {/* Type Selection */}
            <div className="flex flex-wrap gap-2">
              {opportunityTypes.map((type) => (
                <Badge
                  key={type.id}
                  variant={form.type.includes(type.id) ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80 px-3 py-1.5"
                  onClick={() => handleTypeChange(type.id)}
                >
                  <span className="mr-1">{type.icon}</span>
                  {type.label}
                </Badge>
              ))}
            </div>

            {/* Title */}
            <Input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="What's the opportunity about?"
              required
              className="text-lg font-medium border-none px-0 focus-visible:ring-0 placeholder:text-gray-400"
            />

            {/* Description */}
            <Textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Tell us more about this opportunity... (include URLs if needed)"
              required
              rows={4}
              className="resize-none border-none px-0 focus-visible:ring-0 placeholder:text-gray-400"
            />

            {/* Tags Row */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <Hash className="w-4 h-4 text-gray-400" />
              <Input
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="Add tags (ai, blockchain, web3...)"
                className="border-none px-0 focus-visible:ring-0 placeholder:text-gray-400 text-sm"
              />
            </div>

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
                        form.location && "text-blue-600 bg-blue-50"
                      )}
                    >
                      <MapPin className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="start">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Location</label>
                      <Input
                        name="location"
                        value={form.location}
                        onChange={handleChange}
                        placeholder="City, Country"
                        className="text-sm"
                      />
                    </div>
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
                        form.organiserInfo && "text-blue-600 bg-blue-50"
                      )}
                    >
                      <Building2 className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="start">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Organizer</label>
                      <Input
                        name="organiserInfo"
                        value={form.organiserInfo}
                        onChange={handleChange}
                        placeholder="Company or Organization"
                        className="text-sm"
                      />
                    </div>
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
                        form.dateRange && "text-blue-600 bg-blue-50"
                      )}
                    >
                      <CalendarIcon className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={form.dateRange}
                      onSelect={(range) =>
                        setForm((prev) => ({ ...prev, dateRange: range }))
                      }
                      numberOfMonths={2}
                    />
                    {form.dateRange?.from && (
                      <div className="p-3 border-t text-sm">
                        <p className="font-medium">Selected dates:</p>
                        <p className="text-gray-600">
                          {format(form.dateRange.from, "MMM dd, yyyy")}
                          {form.dateRange.to &&
                            ` - ${format(form.dateRange.to, "MMM dd, yyyy")}`}
                        </p>
                      </div>
                    )}
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
                      files.length >= maxFiles &&
                        "opacity-50 cursor-not-allowed"
                    )}
                    disabled={files.length >= maxFiles}
                  >
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={
                  loading ||
                  !form.title ||
                  !form.description ||
                  form.type.length === 0
                }
                size="sm"
                className="px-6"
              >
                {loading ? "Posting..." : "Post"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Image Preview Grid */}
        {files.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {files.map((file, idx) => (
              <div key={idx} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                  {file.uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-sm">{file.progress}%</div>
                    </div>
                  )}
                  {file.error && (
                    <div className="absolute inset-0 bg-red-500 bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-xs">Failed</div>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFile(idx)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}

            {/* Add More Images Placeholder */}
            {files.length < maxFiles && (
              <div
                {...getRootProps()}
                className={cn(
                  "aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors",
                  isDragActive && "border-blue-400 bg-blue-50"
                )}
              >
                <input {...getInputProps()} />
                <Plus className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
