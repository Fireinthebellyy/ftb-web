"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import {
  FileItem,
  UploadProgress,
} from "@/components/opportunity/images/types";
import { createAvatarStorage } from "@/lib/appwrite";

type ProfileUser = {
  id: string;
  name: string;
  email: string;
  image: string;
};

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(80, "Name too long"),
  // image is uploaded via dropzone and resolved to URL
});

export default function ProfileForm({ user }: { user: ProfileUser }) {
  // Editing state: opt-in by default (view mode initially)
  const [isEditing, setIsEditing] = useState(false);
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
    },
  });

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
      toast.error("Failed to upload avatar");
      return null;
    }
  }, [files]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setSubmitting(true);

      const uploadedUrl = await uploadAvatar();

      const payload: { name: string; image?: string | null } = {
        name: values.name,
      };
      if (uploadedUrl !== null) {
        payload.image = uploadedUrl;
      }

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to update profile");
      }

      const data = (await res.json()) as {
        user: { id: string; name: string; email: string; image: string | null };
      };

      // Revoke object URLs and clear local files post-success
      files.forEach((f) => URL.revokeObjectURL(f.preview));
      setFiles([]);

      // Sync local UI
      form.reset({
        name: data.user.name ?? "",
      });

      toast.success("Profile updated");

      // Exit edit mode and announce change
      setIsEditing(false);
      if (modeChangeLiveRef.current) {
        modeChangeLiveRef.current.textContent = "Profile saved. View mode.";
      }
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

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
        <Avatar className="w-16 h-16">
          <AvatarImage src={effectiveAvatar || undefined} alt={user.name} />
          <AvatarFallback>
            {user.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="text-sm text-muted-foreground">Email</div>
          <div className="text-sm">{user.email}</div>
        </div>
        <div className="ml-auto">
          {!isEditing ? (
            <Button
              type="button"
              aria-pressed={false}
              aria-label="Edit Profile"
              onClick={() => {
                setIsEditing(true);
                // announce
                if (modeChangeLiveRef.current) {
                  modeChangeLiveRef.current.textContent =
                    "Edit mode enabled. Form fields are now editable.";
                }
                // focus will move after render
                setTimeout(() => firstEditableRef.current?.focus(), 0);
              }}
            >
              Edit Profile
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              aria-pressed={true}
              aria-label="Exit edit mode without saving"
              onClick={() => {
                // Cancel: revoke previews, reset files and form, exit edit mode
                files.forEach((f) => URL.revokeObjectURL(f.preview));
                setFiles([]);
                form.reset({ name: user.name ?? "" });
                setIsEditing(false);
                if (modeChangeLiveRef.current) {
                  modeChangeLiveRef.current.textContent =
                    "Edit mode canceled. View mode.";
                }
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      <Form {...form}>
        {/* Avatar section */}
        <div className="space-y-2" aria-disabled={!isEditing} aria-live="off">
          <FormLabel>Profile picture</FormLabel>
          <div className={isEditing ? "" : "opacity-60"}>
            <ImageDropzone
              files={files}
              setFiles={setFiles}
              maxFiles={maxFiles}
            />
            {!isEditing && (
              <p className="text-xs text-muted-foreground mt-1">
                Edit mode disabled. Click “Edit Profile” to change your picture.
              </p>
            )}
          </div>
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5"
          aria-label="Profile form"
          aria-describedby="profile-mode-hint"
        >
          <span id="profile-mode-hint" className="sr-only">
            {isEditing ? "Edit mode." : "View mode."}
          </span>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>

                {/* View mode: read-only text */}
                {!isEditing ? (
                  <div className="py-2 px-3 rounded-md border bg-muted/30 text-sm">
                    {field.value || "—"}
                  </div>
                ) : (
                  <FormControl>
                    <Input
                      placeholder="Your name"
                      {...field}
                      ref={(el) => {
                        // preserve RHF ref
                        if (typeof field.ref === "function") field.ref(el);
                        else (field as any).ref = el;
                        firstEditableRef.current = el;
                      }}
                      aria-required="true"
                      aria-invalid={!!form.formState.errors.name}
                    />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Controls: only show Save/Reset when editing */}
          {isEditing ? (
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  files.forEach((f) => URL.revokeObjectURL(f.preview));
                  setFiles([]);
                  form.reset({ name: user.name ?? "" });
                }}
                disabled={submitting}
              >
                Reset
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save"}
              </Button>
            </div>
          ) : null}
        </form>
      </Form>
    </div>
  );
}
