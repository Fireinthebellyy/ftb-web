"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  live_session: "Live Session",
  meet_mentor: "Meet The Mentor",
  resources: "Resources and Presentation",
  recording: "Session Recording",
};

const sessionContentSchema = z.object({
  sectionType: z.enum(["live_session", "meet_mentor", "resources", "recording"]),
  title: z.string().min(1, { message: "Title is required" }),
  content: z.string().optional(),
  isUnlocked: z.boolean().default(false),
  lockedMessage: z.string().optional(),
  liveSessionLink: z.string().optional(),
  videoUrl: z.string().optional(),
  images: z.array(z.string()).optional(),
});

type SessionContentFormValues = z.infer<typeof sessionContentSchema>;

interface ContentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdding: boolean;
  defaultValues: SessionContentFormValues;
  editingContent: any;
  onSave: (data: SessionContentFormValues) => void;
}

export function ContentEditDialog({
  open,
  onOpenChange,
  isAdding,
  defaultValues,
  editingContent,
  onSave,
}: ContentEditDialogProps) {
  const form = useForm<SessionContentFormValues>({
    resolver: zodResolver(sessionContentSchema),
    defaultValues,
  });

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await fetch("/api/storage/sign-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain: "opportunity-attachments",
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Upload API error:", errorData);
        throw new Error(errorData.error || "Failed to get upload URL");
      }

      const { uploadUrl, publicUrl } = await response.json();

      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      field.onChange(publicUrl);
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("Failed to upload video");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const response = await fetch("/api/storage/sign-upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            domain: "opportunity-attachments",
            fileName: file.name,
            contentType: file.type,
            fileSize: file.size,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Upload API error:", errorData);
          throw new Error(errorData.error || "Failed to get upload URL");
        }

        const { uploadUrl, publicUrl } = await response.json();

        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        return publicUrl;
      });

      const uploadedImages = await Promise.all(uploadPromises);
      field.onChange([...(field.value || []), ...uploadedImages]);
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isAdding ? "Add Content" : "Edit Content"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="sectionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Type</FormLabel>
                  <FormControl>
                    <select
                      className="w-full border rounded px-3 py-2 bg-white"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value as any)}
                      disabled={!isAdding}
                    >
                      {Object.entries(CONTENT_TYPE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter content title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch("sectionType") === "live_session" && (
              <FormField
                control={form.control}
                name="liveSessionLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Live Session Link</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {form.watch("sectionType") === "recording" && (
              <>
                {editingContent && editingContent.videoUrl && (
                  <div className="p-3 bg-gray-50 rounded border">
                    <p className="text-sm text-gray-600 mb-2">Current video:</p>
                    <a href={editingContent.videoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                      {editingContent.videoUrl}
                    </a>
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="videoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload New Video (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleVideoUpload(e, field)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            {form.watch("sectionType") === "live_session" ||
            form.watch("sectionType") === "resources" ||
            form.watch("sectionType") === "recording" ? (
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Enter content..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            <FormField
              control={form.control}
              name="isUnlocked"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-3">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mb-0">
                    Unlocked (users can see this content)
                  </FormLabel>
                </FormItem>
              )}
            />
            {!form.watch("isUnlocked") && (
              <FormField
                control={form.control}
                name="lockedMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Locked Message (shown to users when content is locked)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="This section is locked. It will be unlocked soon!"
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Images (for carousel display)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageUpload(e, field)}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">You can select multiple images. They will be displayed in carousel in the order selected.</p>
                  {field.value && field.value.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {field.value.map((url, index) => (
                        <div key={index} className="relative">
                          <img
                            src={url}
                            alt={`Uploaded ${index + 1}`}
                            className="h-16 w-16 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = [...(field.value || [])];
                              newImages.splice(index, 1);
                              field.onChange(newImages);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {isAdding ? "Add Content" : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
