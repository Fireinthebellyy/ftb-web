"use client";

import axios from "axios";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { storage } from "@/lib/appwrite";
import { TitleField } from "./fields/TitleField";
import { DescriptionField } from "./fields/DescriptionField";
import { TagsField } from "./fields/TagsField";
import { TypeSelector } from "./fields/TypeSelector";
import { MetaPopovers } from "./fields/MetaPopovers";
import { ImageDropzone } from "./images/ImageDropzone";
import { formSchema, FormData } from "./schema";
import { FileItem, UploadProgress } from "./images/types";

export default function NewOpportunityForm({
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

  const watchedType = form.watch("type");
  const watchedLocation = form.watch("location");
  const watchedOrganiser = form.watch("organiserInfo");
  const watchedDateRange = form.watch("dateRange");

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

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-1">
          <TitleField control={form.control} />

          <DescriptionField control={form.control} />

          {/* Image previews + upload trigger */}
          <ImageDropzone
            files={files}
            setFiles={setFiles}
            maxFiles={maxFiles}
          />

          <TagsField control={form.control} />

          <TypeSelector
            control={form.control}
            value={watchedType}
            onChange={handleTypeChange}
          />

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between pt-2">
            <MetaPopovers
              control={form.control}
              watchedLocation={watchedLocation}
              watchedOrganiser={watchedOrganiser}
              watchedDateRange={watchedDateRange}
            />

            <Button type="submit" disabled={loading} size="sm" className="px-6">
              {loading ? "Posting..." : "Post"}
            </Button>
          </div>
        </form>
      </Form>
    </FormProvider>
  );
}
