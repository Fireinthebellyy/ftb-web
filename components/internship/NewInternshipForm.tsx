"use client";

import axios from "axios";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { internshipFormSchema, InternshipFormData } from "./schema";
import { TitleField } from "./fields/TitleField";
import { DescriptionField } from "./fields/DescriptionField";
import { HiringOrganizationField } from "./fields/HiringOrganizationField";
import { TypeSelector } from "./fields/TypeSelector";
import { TimingSelector } from "./fields/TimingSelector";
import { MetaFields } from "./fields/MetaFields";
import { TagsField } from "./fields/TagsField";
import { EligibilityField } from "./fields/EligibilityField";

export default function NewInternshipForm({
  onInternshipCreated,
  onCancel,
}: {
  onInternshipCreated: () => void;
  onCancel?: () => void;
}) {
  const [loading, setLoading] = useState(false);
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
    },
  });

  const watchedType = form.watch("type");
  const watchedTiming = form.watch("timing");

  function handleTypeChange(type: "onsite" | "remote" | "hybrid") {
    form.setValue("type", type, { shouldValidate: true, shouldTouch: true });
  }

  function handleTimingChange(timing: "full_time" | "part_time") {
    form.setValue("timing", timing, {
      shouldValidate: true,
      shouldTouch: true,
    });
  }

  async function onSubmit(data: InternshipFormData) {
    setLoading(true);

    try {
      const payload = {
        ...data,
        tags:
          data.tags
            ?.split(",")
            .map((t) => t.trim())
            .filter(Boolean) || [],
        link: data.link,
        hiringManager: data.hiringManager || undefined,
        hiringManagerEmail: data.hiringManagerEmail || undefined,
        experience: data.experience || undefined,
        duration: data.duration || undefined,
        eligibility: data.eligibility || undefined,
      };

      const res = await axios.post("/api/internships", payload);
      if (res.status !== 200 && res.status !== 201)
        throw new Error("Failed to create internship");

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
          const errorMessages = errorData.error
            .map((e: any) => e.message)
            .join(", ");
          toast.error(`Validation error: ${errorMessages}`);
        } else if (errorData?.message) {
          toast.error(errorData.message);
        } else {
          toast.error(
            "Failed to create internship. Please check all required fields."
          );
        }
      } else if (err instanceof Error) {
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
        toast.error(err.message);
      } else {
        console.error("Unknown error type:", typeof err);
        toast.error("Unknown error occurred");
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

          <div className="flex items-center justify-end gap-2 pt-4">
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
            <Button type="submit" disabled={loading} className="px-6">
              {loading ? "Creating..." : "Create Internship"}
            </Button>
          </div>
        </form>
      </Form>
    </FormProvider>
  );
}
