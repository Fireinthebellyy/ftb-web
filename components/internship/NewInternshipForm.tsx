"use client";

import axios from "axios";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { internshipFormSchema, InternshipFormData } from "./schema";
import { createOpportunityStorage } from "@/lib/appwrite";
import { FileItem, UploadProgress } from "@/types/interfaces";
import { TitleField } from "./fields/TitleField";
import { DescriptionField } from "./fields/DescriptionField";
import { HiringOrganizationField } from "./fields/HiringOrganizationField";
import { TypeSelector } from "./fields/TypeSelector";
import { TimingSelector } from "./fields/TimingSelector";
import { MetaFields } from "./fields/MetaFields";
import { TagsField } from "./fields/TagsField";
import { EligibilityField } from "./fields/EligibilityField";
import { PosterField } from "./fields/PosterField";
import { useQueryClient } from "@tanstack/react-query";

export default function NewInternshipForm({
  onInternshipCreated,
  onCancel,
}: {
  onInternshipCreated: () => void;
  onCancel?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<FileItem | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<InternshipFormData>({
    resolver: zodResolver(internshipFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      type: undefined,
      timing: undefined,
      title: "",
      description: "",
      hiringOrganization: "",
      tags: "",
      eligibility: undefined,
      location: "",
      stipend: undefined,
      hiringManager: "",
      hiringManagerEmail: "",
      experience: "",
      duration: "",
      link: "",
      deadline: "",
      poster: "",
    },
  });

  const watchedType = form.watch("type");
  const watchedTiming = form.watch("timing");

  function handleTypeChange(type: "in-office" | "work-from-home" | "hybrid") {
    form.setValue("type", type, { shouldValidate: true, shouldTouch: true });
  }

  function handleTimingChange(timing: "full-time" | "part-time" | "shift-based") {
    form.setValue("timing", timing, { shouldValidate: true, shouldTouch: true });
  }

  async function uploadLogo(): Promise<string | null> {
    if (!logoFile) return null;

    try {
      const internshipStorage = createOpportunityStorage();
      const bucketId = process.env.NEXT_PUBLIC_APPWRITE_OPPORTUNITIES_BUCKET_ID;

      if (!bucketId) {
        throw new Error("Appwrite bucket ID not configured");
      }

      setLogoFile((prev) => prev ? { ...prev, uploading: true, progress: 0 } : null);

      const res = await internshipStorage.createFile(
        bucketId,
        "unique()",
        logoFile.file,
        [],
        (progress: UploadProgress) => {
          const percent = Math.round(progress.progress || 0);
          setLogoFile((prev) => prev ? { ...prev, progress: percent } : null);
        }
      );

      // Get the file view URL
      const logoUrl = internshipStorage.getFileView(bucketId, res.$id);

      setLogoFile((prev) => prev ? { ...prev, uploading: false, fileId: res.$id } : null);

      return logoUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown upload error";
      toast.error(`Failed to upload logo: ${message}`);
      setLogoFile((prev) => prev ? { ...prev, uploading: false, error: true, errorMessage: message } : null);
      throw err;
    }
  }

  async function onSubmit(data: InternshipFormData) {
    setLoading(true);

    try {
      // Upload logo if a new file is selected
      let logoUrl = data.poster;
      if (logoFile && !logoFile.error) {
        try {
          logoUrl = await uploadLogo();
          if (!logoUrl) {
            toast.error("Failed to upload logo. Please try again.");
            setLoading(false);
            return;
          }
        } catch {
          // Error already shown in uploadLogo
          setLoading(false);
          return;
        }
      }

      // Validate that logo is present (either uploaded file or existing URL)
      if (!logoUrl && !data.poster) {
        form.setError("poster", {
          type: "manual",
          message: "Company logo is required.",
        });
        toast.error("Please upload a company logo.");
        setLoading(false);
        return;
      }

      const payload = {
        ...data,
        poster: logoUrl || data.poster || "",
        tags: data.tags
          ?.split(",")
          .map((t) => t.trim())
          .filter(Boolean) || [],
        link: data.link || undefined,
        hiringManager: data.hiringManager || undefined,
        hiringManagerEmail: data.hiringManagerEmail || undefined,
        experience: data.experience || undefined,
        duration: data.duration || undefined,
        eligibility: data.eligibility || undefined,
      };

      const res = await axios.post("/api/internships", payload);
      if (res.status !== 200 && res.status !== 201)
        throw new Error("Failed to create internship");

      // Cleanup
      if (logoFile) {
        URL.revokeObjectURL(logoFile.preview);
        setLogoFile(null);
      }

      toast.success("Internship submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["internships"] });
      onInternshipCreated();
    } catch (err: unknown) {
      console.error("=== FORM SUBMISSION ERROR ===");
      console.error("Error:", err);

      if (axios.isAxiosError(err)) {
        console.error("Axios error response:", err.response?.data);
        console.error("Axios error status:", err.response?.status);
        const errorData = err.response?.data;
        if (errorData?.error && Array.isArray(errorData.error)) {
          // Zod validation errors
          const errorMessages = errorData.error.map((e: any) => e.message).join(", ");
          toast.error(`Validation error: ${errorMessages}`);
        } else if (errorData?.message) {
          toast.error(errorData.message);
        } else {
          toast.error("Failed to create internship. Please check all required fields.");
        }
      } else if (err instanceof Error) {
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
        toast.error(err.message);
      } else {
        console.error("Unknown error type:", typeof err);
        toast.error("Unknown error occurred");
      }

      // Cleanup on error
      if (logoFile) {
        URL.revokeObjectURL(logoFile.preview);
        setLogoFile(null);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <TitleField control={form.control} />

          <DescriptionField control={form.control} />

          <HiringOrganizationField control={form.control} />

          <TagsField control={form.control} />

          <EligibilityField control={form.control} />

          <PosterField
            control={form.control}
            logoFile={logoFile}
            setLogoFile={setLogoFile}
          />

          <TypeSelector
            control={form.control}
            value={watchedType}
            onChange={handleTypeChange}
          />

          <TimingSelector
            control={form.control}
            value={watchedTiming}
            onChange={handleTimingChange}
          />

          <MetaFields control={form.control} />

          <div className="flex items-center gap-2 justify-end pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="px-6"
            >
              {loading ? "Creating..." : "Create Internship"}
            </Button>
          </div>
        </form>
      </Form>
    </FormProvider>
  );
}
