/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Loader2, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { ToolkitImageInput } from "./ToolkitImageInput";
import { uploadFileViaSignedUrl } from "@/lib/storage/client";

const slideFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  mobileImageUrl: z.string().optional(),
  desktopImageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  orderIndex: z.number().default(0),
});

type SlideFormValues = z.infer<typeof slideFormSchema>;

type Slide = {
  id: string;
  title: string;
  description: string | null;
  mobileImageUrl: string | null;
  desktopImageUrl: string | null;
  orderIndex: number;
  isActive: boolean;
};

export function MentorshipCarouselManager({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [mobileImageFile, setMobileImageFile] = useState<File | null>(null);
  const [desktopImageFile, setDesktopImageFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { data: slides = [], isLoading } = useQuery({
    queryKey: ["admin", "mentorship-carousel"],
    queryFn: async () => (await axios.get<Slide[]>("/api/admin/mentorship-carousel")).data,
    enabled: open,
  });

  const form = useForm<SlideFormValues>({
    resolver: zodResolver(slideFormSchema),
    defaultValues: {
      title: "",
      description: "",
      mobileImageUrl: "",
      desktopImageUrl: "",
      isActive: true,
      orderIndex: 0,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<Slide>) => {
      if (editingSlide) {
        return axios.put(`/api/admin/mentorship-carousel/${editingSlide.id}`, payload);
      } else {
        return axios.post("/api/admin/mentorship-carousel", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "mentorship-carousel"] });
      toast.success(`Slide ${editingSlide ? "updated" : "created"}`);
      setEditingSlide(null);
      form.reset({ title: "", description: "", mobileImageUrl: "", desktopImageUrl: "", isActive: true, orderIndex: slides.length });
    },
    onError: () => {
      toast.error(`Failed to ${editingSlide ? "update" : "create"} slide`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/admin/mentorship-carousel/${id}`);
    },
    onSuccess: () => {
      toast.success("Slide deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "mentorship-carousel"] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await axios.put(`/api/admin/mentorship-carousel/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "mentorship-carousel"] });
    },
  });

  const onSubmit = async (data: SlideFormValues) => {
    try {
      let mobileImageUrl = data.mobileImageUrl;
      if (mobileImageFile) {
        const uploadedMobile = await uploadFileViaSignedUrl({
          domain: "ungatekeep-images",
          file: mobileImageFile,
        });
        mobileImageUrl = uploadedMobile.publicUrl;
      }
      
      let desktopImageUrl = data.desktopImageUrl;
      if (desktopImageFile) {
        const uploadedDesktop = await uploadFileViaSignedUrl({
          domain: "ungatekeep-images",
          file: desktopImageFile,
        });
        desktopImageUrl = uploadedDesktop.publicUrl;
      }
      
      await saveMutation.mutateAsync({
        ...data,
        mobileImageUrl: mobileImageUrl || undefined,
        desktopImageUrl: desktopImageUrl || undefined,
      });
      setMobileImageFile(null);
      setDesktopImageFile(null);
    } catch (_e) {
      toast.error("Error saving slide");
    }
  };

  const handleEdit = (slide: Slide) => {
    setEditingSlide(slide);
    form.reset({
      title: slide.title,
      description: slide.description || "",
      mobileImageUrl: slide.mobileImageUrl || "",
      desktopImageUrl: slide.desktopImageUrl || "",
      isActive: slide.isActive,
      orderIndex: slide.orderIndex,
    });
    setMobileImageFile(null);
    setDesktopImageFile(null);
  };

  const handleCancelEdit = () => {
    setEditingSlide(null);
    form.reset({ title: "", description: "", mobileImageUrl: "", desktopImageUrl: "", isActive: true, orderIndex: slides.length });
    setMobileImageFile(null);
    setDesktopImageFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) {
        handleCancelEdit();
        onClose();
      }
    }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>1:1 Mentorship Carousel Slides</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Form Section */}
          <div className="rounded-lg border bg-gray-50/50 p-4">
            <h3 className="mb-4 font-medium text-sm">
              {editingSlide ? "Edit Slide" : "Add New Slide"}
            </h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Slide title" {...field} />
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
                        <Textarea placeholder="Short description" {...field} />
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
                      <FormLabel>Order</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border bg-white p-3">
                      <FormLabel className="text-sm font-medium">Active</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="space-y-4">
                  <div>
                    <FormLabel className="mb-2 block">Mobile Image</FormLabel>
                    <p className="text-xs text-gray-500 mb-2">Recommended: 256 x 171 px (or 512 x 342 px for Retina)</p>
                    <ToolkitImageInput
                      label="mobile image"
                      selectedFile={mobileImageFile}
                      onFileSelect={setMobileImageFile}
                      onRemove={() => {
                        setMobileImageFile(null);
                        form.setValue("mobileImageUrl", "");
                      }}
                      imageUrl={form.watch("mobileImageUrl")}
                    />
                  </div>
                  <div>
                    <FormLabel className="mb-2 block">Desktop Image</FormLabel>
                    <p className="text-xs text-gray-500 mb-2">Recommended: Ultra-wide (e.g. 1450 x 130 px)</p>
                    <ToolkitImageInput
                      label="desktop image"
                      selectedFile={desktopImageFile}
                      onFileSelect={setDesktopImageFile}
                      onRemove={() => {
                        setDesktopImageFile(null);
                        form.setValue("desktopImageUrl", "");
                      }}
                      imageUrl={form.watch("desktopImageUrl")}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  {editingSlide && (
                    <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" size="sm" disabled={saveMutation.isPending}>
                    {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingSlide ? "Update" : "Add Slide"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* List Section */}
          <div className="space-y-3 rounded-lg border p-4">
            <h3 className="font-medium text-sm">Existing Slides</h3>
            {isLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
            ) : slides.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No slides added yet.</p>
            ) : (
              <div className="space-y-2">
                {slides.map((slide) => (
                  <div key={slide.id} className="flex items-center justify-between rounded border p-2 text-sm bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <GripVertical className="h-4 w-4 text-gray-400 shrink-0 cursor-grab" />
                      {(slide.mobileImageUrl || slide.desktopImageUrl) && (
                        <img src={slide.mobileImageUrl || slide.desktopImageUrl!} alt="" className="h-8 w-8 object-cover rounded shrink-0" />
                      )}
                      <div className="truncate">
                        <p className="font-medium truncate">{slide.title}</p>
                        <p className="text-xs text-gray-500">Order: {slide.orderIndex}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Switch 
                        checked={slide.isActive} 
                        onCheckedChange={(val) => toggleStatusMutation.mutate({ id: slide.id, isActive: val })}
                        className="scale-75"
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(slide)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => {
                        if (confirm("Delete this slide?")) deleteMutation.mutate(slide.id);
                      }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
