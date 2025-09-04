"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageDropzone } from "@/components/opportunity/images/ImageDropzone";
import { createAvatarStorage } from "@/lib/appwrite";
import { FileItem, ProfileUser, UploadProgress } from "@/types/interfaces";
import FieldInterestSelector from "@/components/profile/FieldInterestSelector";
import OpportunityInterestSelector from "@/components/profile/OpportunityInterestSelector";
import CurrentRoleSelector from "@/components/profile/CurrentRoleSelector";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const formSchema = z
  .object({
  name: z.string().min(1, "Name is required").max(80, "Name too long"),
  fieldInterests: z.array(z.string()).min(1, "Select at least 1 field interest").default([]),
  fieldInterestOther: z.string().optional(),
  opportunityInterests: z.array(z.string()).min(1, "Select at least 1 opportunity interest").default([]),
  opportunityInterestOther: z.string().optional(),
  dateOfBirth: z.string().optional(),
  collegeInstitute: z
    .string()
    .trim()
    .max(80, "Too long")
    .optional()
    .refine(
      (v) => v === undefined || v === "" || /^[A-Za-z0-9 .,&'()\-]+$/.test(v),
      "No special characters"
    )
    .refine(
      (v) => v === undefined || v === "" || !/^\d+$/.test(v),
      "Cannot be only numbers"
    ),
  contactNumber: z
    .string()
    .optional()
    .transform((v) => (v ?? "").trim())
    .refine((v) => v === "" || /^\d{10}$/.test(v), "Enter 10 digit number only"),
  currentRole: z.string().min(1, "Please select your current role"),
  currentRoleOther: z.string().optional(),
  // image is uploaded via dropzone and resolved to URL
  })
  .superRefine((vals, ctx) => {
    if (Array.isArray(vals.fieldInterests) && vals.fieldInterests.includes("Other")) {
      if (!vals.fieldInterestOther || vals.fieldInterestOther.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please specify your other field interest",
          path: ["fieldInterestOther"],
        });
      }
    }
    if (Array.isArray(vals.opportunityInterests) && vals.opportunityInterests.includes("Other")) {
      if (!vals.opportunityInterestOther || vals.opportunityInterestOther.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please specify your other opportunity interest",
          path: ["opportunityInterestOther"],
        });
      }
    }
    if (vals.currentRole === "Other") {
      if (!vals.currentRoleOther || vals.currentRoleOther.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please specify your current role",
          path: ["currentRoleOther"],
        });
      }
    }
  });

export default function ProfileForm({ user }: { user: ProfileUser }) {
  const [isEditing] = useState(true);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const maxFiles = 1;

  // Accessibility: manage focus when entering edit mode
  const firstEditableRef = useRef<HTMLInputElement | null>(null);
  const modeChangeLiveRef = useRef<HTMLDivElement | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name ?? "",
      fieldInterests: user.fieldInterests ?? [],
      fieldInterestOther: "",
      opportunityInterests: user.opportunityInterests ?? [],
      opportunityInterestOther: "",
      dateOfBirth: user.dateOfBirth ?? "",
      collegeInstitute: user.collegeInstitute ?? "",
      contactNumber: user.contactNumber ?? "",
      currentRole: user.currentRole ?? "",
      currentRoleOther: "",
    },
  });

  const handleResetInterests = useCallback(async () => {
    try {
      setSubmitting(true);
      const payload: { name: string; image?: string | null; fieldInterests?: string[]; opportunityInterests?: string[] } = {
        name: form.getValues("name") ?? user.name ?? "",
        image: user.image ?? null,
        fieldInterests: [],
        opportunityInterests: [],
      };
      const { data } = await axios.post("/api/profile", payload, {
        headers: { "Content-Type": "application/json" },
      });
      files.forEach((f) => URL.revokeObjectURL(f.preview));
      setFiles([]);
      form.reset({
        name: data.user.name ?? "",
        fieldInterests: [],
        fieldInterestOther: "",
        opportunityInterests: [],
        opportunityInterestOther: "",
        currentRole: "",
        currentRoleOther: "",
      });
      
    } catch (e) {
      const err = e as Error;
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }, [files, form, user.image, user.name]);

  const hasLocalPreview = files.length > 0 ? files[0]?.preview : "";
  const effectiveAvatar = useMemo(() => {
    return hasLocalPreview || user.image || "";
  }, [hasLocalPreview, user.image]);

  const uploadAvatar = useCallback(async (): Promise<string | null> => {
    if (files.length === 0) return null;

    // Only consider the first file since avatar is single-file
    const file = files[0];

    try {
      // mark uploading
      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === 0 ? { ...f, uploading: true, progress: 0 } : f
        )
      );

      // Create a storage instance bound to the avatar project
      const avatarStorage = createAvatarStorage();

      const res = await avatarStorage.createFile(
        process.env.NEXT_PUBLIC_APPWRITE_AVATARS_BUCKET_ID as string,
        "unique()",
        file.file,
        [],
        (progress: UploadProgress) => {
          const percent = Math.round((progress.progress || 0) * 100);
          setFiles((prev) =>
            prev.map((f, idx) => (idx === 0 ? { ...f, progress: percent } : f))
          );
        }
      );

      const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT as
        | string
        | undefined;
      const project = process.env.NEXT_PUBLIC_APPWRITE_USR_AVATAR_PROJECT_ID as
        | string
        | undefined;

      const publicUrl =
        endpoint && project
          ? `${endpoint}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_AVATARS_BUCKET_ID}/files/${res.$id}/view?project=${project}`
          : "";

      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === 0 ? { ...f, uploading: false, fileId: res.$id } : f
        )
      );

      return publicUrl || null;
    } catch (err) {
      console.error("Avatar upload failed:", err);
      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === 0 ? { ...f, uploading: false, error: true } : f
        )
      );
      toast.error("Avatar upload failed. Saving without new image.");
      return null;
    }
  }, [files]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setSubmitting(true);

      const uploadedUrl = await uploadAvatar();

      const trimmedOther = (values.fieldInterestOther || "").trim();
      const trimmedOppOther = (values.opportunityInterestOther || "").trim();
      let normalizedInterests = Array.isArray(values.fieldInterests)
        ? [...values.fieldInterests]
        : [];
      let normalizedOppInterests = Array.isArray(values.opportunityInterests)
        ? [...values.opportunityInterests]
        : [];

      // Replace 'Other' with custom text (and remove if empty, though schema prevents empty)
      if (normalizedInterests.includes("Other")) {
        normalizedInterests = normalizedInterests
          .map((v) => (v === "Other" ? trimmedOther : v))
          .filter((v) => !!v && v.trim().length > 0);
      }
      if (normalizedOppInterests.includes("Other")) {
        normalizedOppInterests = normalizedOppInterests
          .map((v) => (v === "Other" ? trimmedOppOther : v))
          .filter((v) => !!v && v.trim().length > 0);
      }

      const payload: { name: string; image?: string | null; fieldInterests?: string[]; opportunityInterests?: string[]; dateOfBirth?: string; collegeInstitute?: string; contactNumber?: string; currentRole?: string } = {
        name: values.name,
        image: uploadedUrl !== null ? uploadedUrl : user.image ?? null,
        fieldInterests: normalizedInterests,
        opportunityInterests: normalizedOppInterests,
        dateOfBirth: values.dateOfBirth || undefined,
        collegeInstitute: values.collegeInstitute || undefined,
        contactNumber: values.contactNumber || undefined,
        currentRole:
          values.currentRole === "Other"
            ? (values.currentRoleOther || "").trim() || undefined
            : values.currentRole || undefined,
      };

      const { data } = await axios.post("/api/profile", payload, {
        headers: { "Content-Type": "application/json" },
      });
      toast.success("Profile updated");

      // Revoke object URLs and clear local files post-success
      files.forEach((f) => URL.revokeObjectURL(f.preview));
      setFiles([]);

      // Sync local UI (keep currentRoleOther so custom badge remains)
      form.reset({
        name: data.user.name ?? "",
        fieldInterests: data.user.fieldInterests ?? [],
        fieldInterestOther: trimmedOther,
        opportunityInterests: data.user.opportunityInterests ?? [],
        opportunityInterestOther: trimmedOppOther,
        dateOfBirth: data.user.dateOfBirth ? String(data.user.dateOfBirth) : "",
        collegeInstitute: data.user.collegeInstitute ?? "",
        contactNumber: data.user.contactNumber ?? "",
        currentRole: data.user.currentRole ?? "",
        currentRoleOther: values.currentRole === "Other" ? (values.currentRoleOther || "") : "",
      });

    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const initialValuesRef = useRef({
    name: user.name ?? "",
    image: user.image ?? null,
    dateOfBirth: user.dateOfBirth ?? "",
    collegeInstitute: user.collegeInstitute ?? "",
    contactNumber: user.contactNumber ?? "",
    currentRole: user.currentRole ?? "",
  });

  const watchedValues = form.watch();

  const hasChanges =
    watchedValues.name !== initialValuesRef.current.name ||
    files.length > 0 ||
    (watchedValues as any).fieldInterests?.length > 0 ||
    !!(watchedValues as any).fieldInterestOther ||
    (watchedValues as any).opportunityInterests?.length > 0 ||
    !!(watchedValues as any).opportunityInterestOther ||
    (watchedValues as any).dateOfBirth !== initialValuesRef.current.dateOfBirth ||
    (watchedValues as any).collegeInstitute !== initialValuesRef.current.collegeInstitute ||
    (watchedValues as any).contactNumber !== initialValuesRef.current.contactNumber ||
    (watchedValues as any).currentRole !== initialValuesRef.current.currentRole;

  return (
    <div className="space-y-6">
      {/* live region for mode change announcements */}
      <div
        ref={modeChangeLiveRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="w-16 h-16">
            <AvatarImage
              src={effectiveAvatar || undefined}
              alt={user.name}
              className="object-cover w-full h-full"
            />
            <AvatarFallback>
              {user.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {isEditing && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full cursor-pointer">
              <div className="absolute inset-0 bg-white opacity-50 rounded-full"></div>
              <div className="relative z-10">
                <ImageDropzone
                  files={files}
                  setFiles={setFiles}
                  maxFiles={maxFiles}
                  className="w-full h-full"
                  buttonClassName="w-full h-full"
                />
              </div>
            </div>
          )}
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Email</div>
          <div className="text-sm">{user.email}</div>
        </div>
        <div className="ml-auto" />
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5"
          aria-label="Profile form"
          aria-describedby="profile-mode-hint"
        >
          <span id="profile-mode-hint" className="sr-only">
            Edit mode.
          </span>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>

                {/* Always editing */}
                <FormControl>
                  <Input
                    placeholder="Your name"
                    {...field}
                    ref={(el) => {
                      if (typeof field.ref === "function") field.ref(el);
                      else (field as any).ref = el;
                      firstEditableRef.current = el;
                    }}
                    aria-required="true"
                    aria-invalid={!!form.formState.errors.name}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FieldInterestSelector control={form.control as any} isEditing={isEditing} />
          <OpportunityInterestSelector control={form.control as any} isEditing={isEditing} />

          <FormField
            control={form.control}
            name="collegeInstitute"
            render={({ field }) => (
              <FormItem>
                <FormLabel>College / Institute</FormLabel>
                <FormControl>
                  <Input placeholder="Your college or institute" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of birth</FormLabel>
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value
                          ? new Date(`${field.value}T00:00:00`).toLocaleDateString()
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(`${field.value}T00:00:00`) : undefined}
                        onSelect={(d) => {
                          if (!d) return field.onChange("");
                          const yyyy = d.getFullYear();
                          const mm = String(d.getMonth() + 1).padStart(2, "0");
                          const dd = String(d.getDate()).padStart(2, "0");
                          field.onChange(`${yyyy}-${mm}-${dd}`);
                        }}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact number</FormLabel>
                <FormControl>
                  <Input inputMode="numeric" autoComplete="tel" maxLength={10} placeholder="Contact Number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <CurrentRoleSelector control={form.control as any} isEditing={isEditing} />

          {/* Controls: always show Save/Reset */}
          <>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetInterests}
                disabled={submitting}
              >
                Reset
              </Button>
              <Button type="submit" disabled={submitting || !hasChanges}>
                {submitting ? "Saving..." : "Save"}
              </Button>
            </div>
            <Alert className="mt-2 border-red-200 bg-red-50">
              <AlertDescription className="text-red-600 font-bold text-sm">
                All the details are confidential & only utilized for enhancing service quality*
              </AlertDescription>
            </Alert>
          </>
        </form>
      </Form>
    </div>
  );
}
