"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Edit, Plus, Trash2, Upload, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { uploadFileViaSignedUrl } from "@/lib/storage/client";

interface ColdDmTemplate {
  id: string;
  title: string;
  description: string | null;
  type: "pdf" | "image" | "document";
  fileUrl: string;
  fileName: string | null;
  fileSize: number | null;
  price: number;
  originalPrice: number | null;
  previewImageUrl: string | null;
  checkoutTitle: string | null;
  checkoutDescription: string | null;
  benefits: string | null;
  isActive: boolean;
  orderIndex: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

const templateFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["pdf", "image", "document"]),
  fileUrl: z.string().url("Invalid URL").optional(),
  fileName: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
  price: z.number().int().positive("Price must be positive"),
  originalPrice: z.number().int().positive().optional(),
  previewImageUrl: z.string().url("Invalid URL").optional(),
  checkoutTitle: z.string().optional(),
  checkoutDescription: z.string().optional(),
  benefits: z.string().optional(),
  orderIndex: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

async function fetchTemplates(): Promise<ColdDmTemplate[]> {
  const response = await axios.get<{ templates: ColdDmTemplate[] }>(
    "/api/admin/cold-dm/templates"
  );
  return response.data.templates;
}

export default function ColdDmTemplatesManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ColdDmTemplate | null>(null);
  const [uploading, setUploading] = useState(false);
  const [benefits, setBenefits] = useState<string[]>([]);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "pdf",
      fileUrl: undefined,
      fileName: undefined,
      fileSize: undefined,
      price: 0,
      originalPrice: undefined,
      previewImageUrl: undefined,
      checkoutTitle: undefined,
      checkoutDescription: undefined,
      benefits: undefined,
      orderIndex: 0,
      isActive: true,
    },
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ["admin", "cold-dm-templates"],
    queryFn: fetchTemplates,
  });

  const createMutation = useMutation({
    mutationFn: async (values: TemplateFormValues) => {
      const response = await axios.post("/api/admin/cold-dm/templates", values);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Template created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "cold-dm-templates"] });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create template");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TemplateFormValues }) => {
      const response = await axios.put(`/api/admin/cold-dm/templates/${id}`, values);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Template updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "cold-dm-templates"] });
      setDialogOpen(false);
      setEditingTemplate(null);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update template");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/admin/cold-dm/templates/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Template deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "cold-dm-templates"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete template");
    },
  });

  const handleOpenDialog = (template?: ColdDmTemplate) => {
    if (template) {
      setEditingTemplate(template);
      const benefitsArray = (template as any).benefits
        ? (template as any).benefits.split(',').map((b: string) => b.trim()).filter((b: string) => b)
        : [];
      setBenefits(benefitsArray);
      form.reset({
        title: template.title,
        description: template.description || "",
        type: template.type,
        fileUrl: template.fileUrl,
        fileName: template.fileName || undefined,
        fileSize: template.fileSize || undefined,
        price: template.price,
        originalPrice: template.originalPrice || undefined,
        previewImageUrl: template.previewImageUrl || undefined,
        checkoutTitle: (template as any).checkoutTitle || undefined,
        checkoutDescription: (template as any).checkoutDescription || undefined,
        benefits: (template as any).benefits || undefined,
        orderIndex: template.orderIndex,
        isActive: template.isActive,
      });
    } else {
      setEditingTemplate(null);
      setBenefits([]);
      form.reset({
        title: "",
        description: "",
        type: "pdf",
        fileUrl: undefined,
        fileName: undefined,
        fileSize: undefined,
        price: 0,
        originalPrice: undefined,
        previewImageUrl: undefined,
        checkoutTitle: undefined,
        checkoutDescription: undefined,
        benefits: undefined,
        orderIndex: 0,
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const onSubmit = (values: TemplateFormValues) => {
    if (!values.fileUrl) {
      toast.error("Please upload a file");
      return;
    }
    const valuesWithBenefits = {
      ...values,
      benefits: benefits.length > 0 ? benefits.join(', ') : undefined,
    };
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, values: valuesWithBenefits });
    } else {
      createMutation.mutate(valuesWithBenefits);
    }
  };

  const handleFileUpload = async (file: File, _type: "pdf" | "image" | "document") => {
    setUploading(true);
    try {
      const result = await uploadFileViaSignedUrl({
        domain: "cold-dm-templates",
        file,
      });

      form.setValue("fileUrl", result.publicUrl);
      form.setValue("fileName", file.name);
      form.setValue("fileSize", file.size);
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const columns: ColumnDef<ColdDmTemplate>[] = [
    {
      id: "title",
      header: "Title",
      cell: ({ row }) => <div className="font-medium">{row.original.title}</div>,
    },
    {
      id: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.type.toUpperCase()}</Badge>
      ),
    },
    {
      id: "price",
      header: "Price",
      cell: ({ row }) => (
        <div>
          <span className="font-semibold">₹{row.original.price}</span>
          {row.original.originalPrice && (
            <span className="ml-2 text-sm text-slate-400 line-through">
              ₹{row.original.originalPrice}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "isActive",
      header: "Active",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "orderIndex",
      header: "Order",
      cell: ({ row }) => <span>{row.original.orderIndex}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenDialog(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteMutation.mutate(row.original.id)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cold DM Templates</h2>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-slate-50">
              {columns.map((column) => (
                <th
                  key={column.id as string}
                  className="px-4 py-3 text-left text-sm font-semibold"
                >
                  {typeof column.header === "string" ? column.header : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {templates?.map((template) => (
              <tr key={template.id} className="border-b">
                <td className="px-4 py-3 font-medium">{template.title}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{template.type.toUpperCase()}</Badge>
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold">₹{template.price}</span>
                  {template.originalPrice && (
                    <span className="ml-2 text-sm text-slate-400 line-through">
                      ₹{template.originalPrice}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={template.isActive ? "default" : "secondary"}>
                    {template.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3">{template.orderIndex}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(template.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "Add New Template"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" {...form.register("title")} />
              {form.formState.errors.title && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...form.register("description")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(value) => form.setValue("type", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Upload File *</Label>
              {editingTemplate && form.watch("fileName") && (
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-md border">
                  <span className="text-sm text-slate-600 truncate">
                    Current file: {form.watch("fileName")}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-[#ec5b13] hover:text-[#d64d0e] hover:bg-orange-50"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept =
                        form.watch("type") === "pdf"
                          ? ".pdf"
                          : form.watch("type") === "image"
                          ? "image/*"
                          : ".doc,.docx,.txt";
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleFileUpload(file, form.watch("type"));
                      };
                      input.click();
                    }}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Change
                  </Button>
                </div>
              )}
              {!editingTemplate && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept =
                      form.watch("type") === "pdf"
                        ? ".pdf"
                        : form.watch("type") === "image"
                        ? "image/*"
                        : ".doc,.docx,.txt";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleFileUpload(file, form.watch("type"));
                    };
                    input.click();
                  }}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : `Upload ${form.watch("type").toUpperCase()} File`}
                </Button>
              )}
              {form.watch("fileUrl") && !editingTemplate && (
                <p className="text-sm text-green-600">
                  ✓ File uploaded successfully
                </p>
              )}
              {form.formState.errors.fileUrl && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.fileUrl.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  {...form.register("price", { valueAsNumber: true })}
                />
                {form.formState.errors.price && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.price.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="originalPrice">Original Price (₹)</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  {...form.register("originalPrice", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderIndex">Order Index</Label>
              <Input
                id="orderIndex"
                type="number"
                {...form.register("orderIndex", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkoutTitle">Checkout Page Title (Optional)</Label>
              <Input
                id="checkoutTitle"
                placeholder="Custom title for checkout page"
                {...form.register("checkoutTitle")}
              />
              <p className="text-xs text-slate-500">Leave empty to use default template title</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkoutDescription">Checkout Page Description (Optional)</Label>
              <Textarea
                id="checkoutDescription"
                className="w-full resize-none whitespace-pre-wrap break-words"
                placeholder="Custom description for checkout page"
                {...form.register("checkoutDescription")}
              />
              <p className="text-xs text-slate-500">Leave empty to use default description</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefits">Benefits (Optional)</Label>
              <div className="space-y-2">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={benefit}
                      onChange={(e) => {
                        const newBenefits = [...benefits];
                        newBenefits[index] = e.target.value;
                        setBenefits(newBenefits);
                      }}
                      placeholder={`Benefit ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newBenefits = benefits.filter((_, i) => i !== index);
                        setBenefits(newBenefits);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBenefits([...benefits, ""])}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Benefit
                </Button>
              </div>
              <p className="text-xs text-slate-500">Add individual benefits that will appear on checkout page</p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={form.watch("isActive")}
                onCheckedChange={(checked) => form.setValue("isActive", checked)}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingTemplate ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
