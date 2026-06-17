/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Edit, Loader2, PlusCircle, RefreshCw, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminTableState } from "@/components/admin/AdminTableState";
import { AdminTabLayout } from "@/components/admin/AdminTabLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToolkitImageInput } from "@/components/admin/ToolkitImageInput";
import { uploadFileViaSignedUrl } from "@/lib/storage/client";

const mentorFormSchema = z.object({
  mentorName: z.string().min(1, "Name is required"),
  mentorEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  mentorNumber: z.string().optional(),
  mentorImage: z.string().optional(),
  description: z.string().optional(),
  linkedinLink: z.string().min(1, "LinkedIn link is required"),
  githubLink: z.string().optional(),
  instaLink: z.string().optional(),
  customLink: z.string().optional(),
  availability: z.boolean().default(true),
});

type MentorFormValues = z.infer<typeof mentorFormSchema>;

type Mentor = {
  id: string;
  mentorName: string;
  mentorEmail?: string;
  mentorNumber?: string;
  mentorImage?: string;
  description?: string;
  linkedinLink: string;
  githubLink?: string;
  instaLink?: string;
  customLink?: string;
  availability: boolean;
};

export default function AdminMentorsTable() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMentor, setEditingMentor] = useState<Mentor | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const {
    data: mentors = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["admin", "mentors"],
    queryFn: async () => (await axios.get<Mentor[]>("/api/admin/mentors")).data,
    staleTime: 1000 * 30,
  });

  const form = useForm<MentorFormValues>({
    resolver: zodResolver(mentorFormSchema),
    defaultValues: {
      mentorName: "",
      mentorEmail: "",
      mentorNumber: "",
      mentorImage: "",
      description: "",
      linkedinLink: "",
      githubLink: "",
      instaLink: "",
      customLink: "",
      availability: true,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<Mentor>) => {
      if (editingMentor) {
        return axios.put(`/api/admin/mentors/${editingMentor.id}`, payload);
      } else {
        return axios.post("/api/admin/mentors", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "mentors"] });
      toast.success(`Mentor ${editingMentor ? "updated" : "created"}`);
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error(`Failed to ${editingMentor ? "update" : "create"} mentor`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/admin/mentors/${id}`);
    },
    onSuccess: () => {
      toast.success("Mentor deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "mentors"] });
    },
    onError: () => {
      toast.error("Failed to delete mentor");
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ id, availability }: { id: string; availability: boolean }) => {
      await axios.put(`/api/admin/mentors/${id}`, { availability });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "mentors"] });
      toast.success("Availability updated");
    },
    onError: () => {
      toast.error("Failed to update availability");
    },
  });

  const handleEdit = useCallback(
    (mentor: Mentor) => {
      setEditingMentor(mentor);
      form.reset({
        mentorName: mentor.mentorName,
        mentorEmail: mentor.mentorEmail,
        mentorNumber: mentor.mentorNumber || "",
        mentorImage: mentor.mentorImage || "",
        description: mentor.description || "",
        linkedinLink: mentor.linkedinLink || "",
        githubLink: mentor.githubLink || "",
        instaLink: mentor.instaLink || "",
        customLink: mentor.customLink || "",
        availability: mentor.availability,
      });
      setImageFile(null);
      setIsDialogOpen(true);
    },
    [form]
  );

  const handleCreate = () => {
    setEditingMentor(null);
    form.reset({
      mentorName: "",
      mentorEmail: "",
      mentorNumber: "",
      mentorImage: "",
      description: "",
      linkedinLink: "",
      githubLink: "",
      instaLink: "",
      customLink: "",
      availability: true,
    });
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: MentorFormValues) => {
    let mentorImage = data.mentorImage;
    if (imageFile) {
      try {
        const uploaded = await uploadFileViaSignedUrl({
          domain: "ungatekeep-images",
          file: imageFile,
        });
        mentorImage = uploaded.publicUrl;
      } catch (_e) {
        toast.error("Error uploading image");
        return;
      }
    }
    
    try {
      await saveMutation.mutateAsync({
        ...data,
        mentorImage: mentorImage || undefined,
      });
    } catch (e) {
      // The mutation handles its own generic error toast, but we can log it
      console.error(e);
    }
  };

  const columns = useMemo<ColumnDef<Mentor>[]>(() => {
    return [
      {
        accessorKey: "mentorImage",
        header: "Image",
        cell: ({ row }) => (
          <div className="h-10 w-10 overflow-hidden rounded-full border bg-muted">
            {row.original.mentorImage ? (
              <img
                src={row.original.mentorImage}
                alt="Mentor"
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "mentorName",
        header: "Name",
      },
      {
        accessorKey: "mentorEmail",
        header: "Email",
      },
      {
        accessorKey: "availability",
        header: "Available",
        cell: ({ row }) => {
          return (
            <Switch
              checked={row.original.availability}
              onCheckedChange={(val) => {
                toggleAvailabilityMutation.mutate({
                  id: row.original.id,
                  availability: val,
                });
              }}
            />
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const mentor = row.original;
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(mentor)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm(`Delete mentor "${mentor.mentorName}"?`)) {
                    deleteMutation.mutate(mentor.id);
                  }
                }}
              >
                <Trash2 className="text-destructive h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ];
  }, [handleEdit, deleteMutation, toggleAvailabilityMutation]);

  return (
    <AdminTabLayout
      title="Mentors Management"
      description="Create and manage mentors for 1:1 mentorship sessions"
      actions={
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button className="gap-2" onClick={handleCreate}>
            <PlusCircle className="h-4 w-4" />
            Add Mentor
          </Button>
        </>
      }
      stats={
        <p className="text-muted-foreground text-sm">
          Total Mentors:{" "}
          <span className="text-foreground font-medium">{mentors.length}</span>
        </p>
      }
    >
      <AdminTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!mentors.length}
        emptyMessage="No mentors found."
        errorMessage="Failed to fetch mentors"
      >
        <AdminDataTable
          tableId="mentors"
          columns={columns}
          data={mentors}
          emptyMessage="No mentors found"
          filterFields={["mentorName", "mentorEmail"]}
          filterPlaceholder="Search by name or email"
        />
      </AdminTableState>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingMentor ? "Edit Mentor" : "Add Mentor"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="mentorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mentorEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mentorNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="About the mentor..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="linkedinLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn Link *</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/in/mentor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="githubLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub Link (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://github.com/mentor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="instaLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram Link (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://instagram.com/mentor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Link (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://portfolio.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <FormLabel>Mentor Image</FormLabel>
                <ToolkitImageInput
                  label="mentor photo"
                  selectedFile={imageFile}
                  onFileSelect={setImageFile}
                  onRemove={() => {
                    setImageFile(null);
                    form.setValue("mentorImage", "");
                  }}
                  imageUrl={form.watch("mentorImage")}
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingMentor ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminTabLayout>
  );
}
