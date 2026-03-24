"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { internshipFormSchema, internshipEditFormSchema, InternshipFormData } from "./schema";
import { TitleField } from "./fields/TitleField";
import { DescriptionField } from "./fields/DescriptionField";
import { HiringOrganizationField } from "./fields/HiringOrganizationField";
import { TypeSelector } from "./fields/TypeSelector";
import { TimingSelector } from "./fields/TimingSelector";
import { MetaFields } from "./fields/MetaFields";
import { TagsField } from "./fields/TagsField";
import { EligibilityField } from "./fields/EligibilityField";

interface Internship {
  id: string;
  title: string;
  description: string;
  hiringOrganization?: string;
  tags?: string[] | string;
  eligibility?: string;
  type?: "onsite" | "remote" | "hybrid";
  timing?: "full_time" | "part_time";
  location?: string;
  stipend?: number;
  hiringManager?: string;
  hiringManagerEmail?: string;
  experience?: string;
  duration?: string;
  link?: string;
  deadline?: string;
}

export default function NewInternshipForm({
  onInternshipCreated,
  onCancel,
  internship,
}: {
  onInternshipCreated: () => void;
  onCancel?: () => void;
  internship?: Internship;
}) {
  const isEditing = !!internship;
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<InternshipFormData>({
    resolver: zodResolver(isEditing ? internshipEditFormSchema : internshipFormSchema),
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

  useEffect(() => {
    if (internship) {
      form.reset({
        type: internship.type ?? undefined,
        timing: internship.timing ?? undefined,
        title: internship.title ?? "",
        description: internship.description ?? "",
        hiringOrganization: internship.hiringOrganization ?? "",
        tags: Array.isArray(internship.tags)
          ? internship.tags.join(", ")
          : internship.tags ?? "",
        eligibility: internship.eligibility ?? undefined,
        location: internship.location ?? "",
        stipend: internship.stipend ?? undefined,
        hiringManager: internship.hiringManager ?? "",
        hiringManagerEmail: internship.hiringManagerEmail ?? "",
        experience: internship.experience ?? "",
        duration: internship.duration ?? "",
        link: internship.link ?? "",
        deadline: internship.deadline ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internship]);

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
        timing: data.timing || undefined,
        type: data.type || undefined,
      };

      if (isEditing) {
        const res = await axios.put(`/api/internships/${internship.id}`, payload);
        if (res.status !== 200) throw new Error("Failed to update internship");
        toast.success("Internship updated successfully!");
      } else {
        const res = await axios.post("/api/internships", payload);
        if (res.status !== 200 && res.status !== 201)
          throw new Error("Failed to create internship");
        toast.success("Internship submitted successfully!");
      }

      queryClient.invalidateQueries({ queryKey: ["internships"] });
      queryClient.invalidateQueries({ queryKey: ["admin-internship-management"] });
      onInternshipCreated();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorData = err.response?.data;
        if (errorData?.error && Array.isArray(errorData.error)) {
          const errorMessages = errorData.error
            .map((e: any) => e.message)
            .join(", ");
          toast.error(`Validation error: ${errorMessages}`);
        } else if (errorData?.message) {
          toast.error(errorData.message);
        } else {
          toast.error(
            isEditing
              ? "Failed to update internship."
              : "Failed to create internship. Please check all required fields."
          );
        }
      } else if (err instanceof Error) {
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
            isRequired={!isEditing}
          />

          <TimingSelector
            control={form.control}
            value={watchedTiming}
            onChange={handleTimingChange}
            isRequired={!isEditing}
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
              {loading
                ? isEditing ? "Updating..." : "Creating..."
                : isEditing ? "Update Internship" : "Create Internship"}
            </Button>
          </div>
        </form>
      </Form>
    </FormProvider>
  );
}