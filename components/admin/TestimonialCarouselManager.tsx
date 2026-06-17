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
import { Switch } from "@/components/ui/switch";
import { ToolkitImageInput } from "./ToolkitImageInput";
import { uploadFileViaSignedUrl } from "@/lib/storage/client";

const slideFormSchema = z.object({
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  orderIndex: z.number().default(0),
});

type SlideFormValues = z.infer<typeof slideFormSchema>;

type TestimonialImage = {
  id: string;
  imageUrl: string;
  orderIndex: number;
  isActive: boolean;
};

export function TestimonialCarouselManager({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [editingImage, setEditingImage] = useState<TestimonialImage | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["admin", "testimonial-images"],
    queryFn: async () => (await axios.get<TestimonialImage[]>("/api/admin/testimonial-images")).data,
    enabled: open,
  });

  const form = useForm<SlideFormValues>({
    resolver: zodResolver(slideFormSchema),
    defaultValues: {
      imageUrl: "",
      isActive: true,
      orderIndex: 0,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<TestimonialImage>) => {
      if (editingImage) {
        return axios.put(`/api/admin/testimonial-images/${editingImage.id}`, payload);
      } else {
        return axios.post("/api/admin/testimonial-images", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "testimonial-images"] });
      toast.success(`Testimonial image ${editingImage ? "updated" : "created"}`);
      setEditingImage(null);
      form.reset({ imageUrl: "", isActive: true, orderIndex: images.length });
    },
    onError: () => {
      toast.error(`Failed to ${editingImage ? "update" : "create"} testimonial image`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/admin/testimonial-images/${id}`);
    },
    onSuccess: () => {
      toast.success("Testimonial image deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "testimonial-images"] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await axios.put(`/api/admin/testimonial-images/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "testimonial-images"] });
    },
  });

  const onSubmit = async (data: SlideFormValues) => {
    try {
      let imageUrl = data.imageUrl;
      if (imageFile) {
        const uploaded = await uploadFileViaSignedUrl({
          domain: "ungatekeep-images",
          file: imageFile,
        });
        imageUrl = uploaded.publicUrl;
      }
      
      if (!imageUrl) {
        toast.error("Please select an image");
        return;
      }

      await saveMutation.mutateAsync({
        ...data,
        imageUrl: imageUrl,
      });
      setImageFile(null);
    } catch (_e) {
      toast.error("Error saving testimonial image");
    }
  };

  const handleEdit = (image: TestimonialImage) => {
    setEditingImage(image);
    form.reset({
      imageUrl: image.imageUrl,
      isActive: image.isActive,
      orderIndex: image.orderIndex,
    });
    setImageFile(null);
  };

  const handleCancelEdit = () => {
    setEditingImage(null);
    form.reset({ imageUrl: "", isActive: true, orderIndex: images.length });
    setImageFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>What Students Feel About Us Images</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Form Section */}
          <div className="rounded-lg border bg-gray-50/50 p-4">
            <h3 className="mb-4 font-medium text-sm">
              {editingImage ? "Edit Image" : "Add New Image"}
            </h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <div>
                  <FormLabel className="mb-2 block">Image</FormLabel>
                  <ToolkitImageInput
                    label="image"
                    selectedFile={imageFile}
                    onFileSelect={setImageFile}
                    onRemove={() => {
                      setImageFile(null);
                      form.setValue("imageUrl", "");
                    }}
                    imageUrl={form.watch("imageUrl")}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  {editingImage && (
                    <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" size="sm" disabled={saveMutation.isPending}>
                    {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingImage ? "Update" : "Add Image"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* List Section */}
          <div className="space-y-3 rounded-lg border p-4">
            <h3 className="font-medium text-sm">Existing Images</h3>
            {isLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
            ) : images.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No images added yet.</p>
            ) : (
              <div className="space-y-2">
                {images.map((image) => (
                  <div key={image.id} className="flex items-center justify-between rounded border p-2 text-sm bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <GripVertical className="h-4 w-4 text-gray-400 shrink-0 cursor-grab" />
                      <img src={image.imageUrl} alt="" className="h-8 w-8 object-cover rounded shrink-0" />
                      <div className="truncate">
                        <p className="font-medium truncate">Order: {image.orderIndex}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Switch 
                        checked={image.isActive} 
                        onCheckedChange={(val) => toggleStatusMutation.mutate({ id: image.id, isActive: val })}
                        className="scale-75"
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(image)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => {
                        if (confirm("Delete this image?")) deleteMutation.mutate(image.id);
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
