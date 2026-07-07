"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { normalizeRichText } from "@/lib/rich-text";
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  deleteStorageObjectClient,
  uploadFileViaSignedUrl,
} from "@/lib/storage/client";
import { ToolkitFormFields } from "@/components/admin/ToolkitFormFields";
import {
  DigitalProductSection,
  toolkitFormSchema,
  ToolkitFormValues,
} from "@/components/admin/types";




function formatHighlight(highlight: string) {
  const trimmed = highlight.trim();

  if (!trimmed) {
    return "";
  }

  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

async function fetchDigitalProductSections(): Promise<DigitalProductSection[]> {
  const response = await axios.get<DigitalProductSection[]>(
    "/api/digital-product-sections"
  );
  return response.data;
}

interface NewToolkitModalProps {
  children: React.ReactNode;
  onSuccess?: () => void;
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
  const [mentorImageFile, setMentorImageFile] = useState<File | null>(null);
  const { data: digitalProductSections = [] } = useQuery({
    queryKey: ["admin", "digital-product-sections"],
    queryFn: fetchDigitalProductSections,
    staleTime: 1000 * 60,
    enabled: open,
  });

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
      digitalProductSectionId: "",
      mentorshipDetails: undefined,
    },
  });

  async function onSubmit(data: ToolkitFormValues) {
    const existingCoverUrl = data.coverImageUrl?.trim() ?? "";
    if (data.category !== "digital products" && !existingCoverUrl && !coverImageFile) {
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

      let mentorImageUrl = data.mentorshipDetails?.mentor?.imageUrl;
      if (mentorImageFile) {
        const uploadedMentor = await uploadFileViaSignedUrl({
          domain: "ungatekeep-images",
          file: mentorImageFile,
        });
        mentorImageUrl = uploadedMentor.publicUrl;
        uploadedKeys.push(uploadedMentor.key);
      }

      const cleanedData = {
        ...data,
        description: normalizeRichText(data.description),
        coverImageUrl,
        bannerImageUrl,
        mentorshipDetails: data.mentorshipDetails ? {
          ...data.mentorshipDetails,
          mentor: data.mentorshipDetails.mentor ? {
            ...data.mentorshipDetails.mentor,
            imageUrl: mentorImageUrl,
          } : undefined
        } : undefined,
        videoUrl: data.videoUrl || undefined,
        category: data.category || undefined,
        digitalProductSectionId: null,
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
        isCohort: data.category === "Cohort",
      };

      const response = await axios.post("/api/toolkits", cleanedData);

      if (response.status === 201) {
        toast.success("Toolkit created successfully!");
        setOpen(false);
        form.reset();
        setCoverImageFile(null);
        setBannerImageFile(null);
        setMentorImageFile(null);
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
      setMentorImageFile(null);
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
            <ToolkitFormFields
              control={form.control}
              coverImageFile={coverImageFile}
              bannerImageFile={bannerImageFile}
              onCoverImageFileSelect={setCoverImageFile}
              onBannerImageFileSelect={setBannerImageFile}
              onCoverImageRemove={() => {
                setCoverImageFile(null);
                form.setValue("coverImageUrl", "");
              }}
              onBannerImageRemove={() => {
                setBannerImageFile(null);
                form.setValue("bannerImageUrl", "");
              }}
              digitalProductSections={digitalProductSections}
              isSubmitting={isSubmitting}
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
