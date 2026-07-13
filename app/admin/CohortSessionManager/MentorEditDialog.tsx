"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const mentorSchema = z.object({
  contentId: z.string().min(1, { message: "Content ID is required" }),
  name: z.string().min(1, { message: "Mentor name is required" }),
  role: z.string().optional(),
  imageUrl: z.string().optional(),
  bio: z.string().optional(),
  linkedinUrl: z.string().optional(),
  otherLinks: z.array(z.object({ title: z.string(), url: z.string() })).optional(),
  orderIndex: z.coerce.number().int().min(0).default(0),
});

type MentorFormValues = z.infer<typeof mentorSchema>;

interface MentorEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdding: boolean;
  defaultValues: MentorFormValues;
  onSave: (data: MentorFormValues) => void;
}

export function MentorEditDialog({
  open,
  onOpenChange,
  isAdding,
  defaultValues,
  onSave,
}: MentorEditDialogProps) {
  const form = useForm<MentorFormValues>({
    resolver: zodResolver(mentorSchema),
    defaultValues,
  });

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: ControllerRenderProps<MentorFormValues, "imageUrl">
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await fetch("/api/storage/sign-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain: "avatar-images",
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

      const putResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!putResponse.ok) {
        throw new Error(`Upload failed with status ${putResponse.status}`);
      }

      field.onChange(publicUrl);
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isAdding ? "Add Mentor" : "Edit Mentor"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mentor Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter mentor name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Senior Developer, Product Manager" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, field)}
                    />
                  </FormControl>
                  {field.value && (
                    <div className="mt-2">
                      <img
                        src={field.value}
                        alt="Mentor preview"
                        className="h-20 w-20 rounded-full object-cover border"
                      />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description/Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter mentor description..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="linkedinUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://linkedin.com/in/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                {isAdding ? "Add Mentor" : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
