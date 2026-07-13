"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const resourceSchema = z.object({
  contentId: z.string().min(1, { message: "Content ID is required" }),
  name: z.string().min(1, { message: "Resource name is required" }),
  url: z.string().min(1, { message: "Resource URL is required" }),
  type: z.enum(["file", "video", "link", "image", "pdf", "ppt"]),
  orderIndex: z.coerce.number().int().min(0).default(0),
});

type ResourceFormValues = z.infer<typeof resourceSchema>;

interface ResourceEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdding: boolean;
  defaultValues: ResourceFormValues;
  onSave: (data: ResourceFormValues) => void;
}

export function ResourceEditDialog({
  open,
  onOpenChange,
  isAdding,
  defaultValues,
  onSave,
}: ResourceEditDialogProps) {
  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await fetch("/api/storage/sign-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain: "cohort-resources",
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
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isAdding ? "Add Resource" : "Edit Resource"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter resource name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource Type</FormLabel>
                  <FormControl>
                    <select
                      className="w-full border rounded px-3 py-2 bg-white"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value as any)}
                      disabled={!isAdding}
                    >
                      <option value="file">File</option>
                      <option value="video">Video</option>
                      <option value="link">Link</option>
                      <option value="image">Image</option>
                      <option value="pdf">PDF</option>
                      <option value="ppt">Presentation</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch("type") === "link" ? (
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upload File</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept={
                          form.watch("type") === "image"
                            ? "image/*"
                            : form.watch("type") === "pdf"
                            ? ".pdf"
                            : form.watch("type") === "ppt"
                            ? ".ppt,.pptx"
                            : "*/*"
                        }
                        onChange={(e) => handleFileUpload(e, field)}
                      />
                    </FormControl>
                    {field.value && (
                      <div className="mt-2">
                        <a
                          href={field.value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline break-all"
                        >
                          {field.value}
                        </a>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="orderIndex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Index</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
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
                {isAdding ? "Add Resource" : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
