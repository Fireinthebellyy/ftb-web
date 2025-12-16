"use client";

import axios from "axios";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { internshipFormSchema, InternshipFormData } from "./schema";
import { TitleField } from "./fields/TitleField";
import { DescriptionField } from "./fields/DescriptionField";
import { HiringOrganizationField } from "./fields/HiringOrganizationField";
import { TypeSelector } from "./fields/TypeSelector";
import { MetaFields } from "./fields/MetaFields";
import { TagsField } from "./fields/TagsField";
import { useQueryClient } from "@tanstack/react-query";

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
      title: "",
      description: "",
      hiringOrganization: "",
      tags: "",
      location: "",
      stipend: undefined,
      hiringManager: "",
      link: "",
      deadline: "",
    },
  });

  const watchedType = form.watch("type");

  function handleTypeChange(type: "part-time" | "full-time" | "contract" | "remote") {
    form.setValue("type", type, { shouldValidate: true, shouldTouch: true });
  }

  async function onSubmit(data: InternshipFormData) {
    setLoading(true);

    try {
      const payload = {
        ...data,
        tags: data.tags
          ?.split(",")
          .map((t) => t.trim())
          .filter(Boolean) || [],
      };

      const res = await axios.post("/api/internships", payload);
      if (res.status !== 200 && res.status !== 201)
        throw new Error("Failed to create internship");

      toast.success("Internship submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["internships"] });
      onInternshipCreated();
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <TitleField control={form.control} />

          <DescriptionField control={form.control} />

          <HiringOrganizationField control={form.control} />

          <TagsField control={form.control} />

          <TypeSelector
            control={form.control}
            value={watchedType}
            onChange={handleTypeChange}
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
