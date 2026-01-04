"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  FileText,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import ToolkitContentManager from "./ToolkitContentManager";

const toolkitFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters." }),
  price: z.coerce
    .number()
    .min(0, { message: "Price must be a positive number." }),
  originalPrice: z.coerce.number().min(0).optional(),
  category: z.string().optional(),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  videoUrl: z.string().url().optional().or(z.literal("")),
  totalDuration: z.string().optional(),
  lessonCount: z.coerce.number().int().min(0).optional(),
  highlights: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

type ToolkitFormValues = z.infer<typeof toolkitFormSchema>;

interface Toolkit {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  coverImageUrl: string | null;
  videoUrl: string | null;
  contentUrl: string | null;
  category: string | null;
  highlights: string[] | null;
  totalDuration: string | null;
  lessonCount: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  creatorName: string | null;
}

export default function AdminToolkitsTable() {
  const [toolkits, setToolkits] = useState<Toolkit[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingToolkit, setEditingToolkit] = useState<Toolkit | null>(null);
  const [contentManagerOpen, setContentManagerOpen] = useState(false);
  const [managingToolkit, setManagingToolkit] = useState<Toolkit | null>(null);

  const form = useForm<ToolkitFormValues>({
    resolver: zodResolver(toolkitFormSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      originalPrice: undefined,
      category: "",
      coverImageUrl: "",
      videoUrl: "",
      totalDuration: "",
      lessonCount: 0,
      highlights: [],
      isActive: true,
    },
  });

  const fetchToolkits = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/toolkits");
      setToolkits(response.data);
    } catch (error) {
      console.error("Error fetching toolkits:", error);
      toast.error("Failed to fetch toolkits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToolkits();
  }, []);

  const handleEdit = (toolkit: Toolkit) => {
    setEditingToolkit(toolkit);
    form.reset({
      title: toolkit.title,
      description: toolkit.description,
      price: toolkit.price,
      originalPrice: toolkit.originalPrice ?? undefined,
      category: toolkit.category ?? "",
      coverImageUrl: toolkit.coverImageUrl ?? "",
      videoUrl: toolkit.videoUrl ?? "",
      totalDuration: toolkit.totalDuration ?? "",
      lessonCount: toolkit.lessonCount ?? 0,
      highlights: toolkit.highlights ?? [],
      isActive: toolkit.isActive,
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async (data: ToolkitFormValues) => {
    if (!editingToolkit) return;

    try {
      const cleanedData = {
        ...data,
        coverImageUrl: data.coverImageUrl || undefined,
        videoUrl: data.videoUrl || undefined,
        category: data.category || undefined,
        totalDuration: data.totalDuration || undefined,
        lessonCount: data.lessonCount || undefined,
        highlights: data.highlights?.filter(Boolean) || undefined,
      };

      await axios.put(`/api/admin/toolkits/${editingToolkit.id}`, cleanedData);
      toast.success("Toolkit updated successfully!");
      setEditDialogOpen(false);
      fetchToolkits();
    } catch (error) {
      console.error("Error updating toolkit:", error);
      toast.error("Failed to update toolkit");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      await axios.delete(`/api/admin/toolkits/${id}`);
      toast.success("Toolkit deleted successfully!");
      fetchToolkits();
    } catch (error) {
      console.error("Error deleting toolkit:", error);
      toast.error("Failed to delete toolkit");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await axios.put(`/api/admin/toolkits/${id}`, { isActive });
      toast.success(`Toolkit ${isActive ? "activated" : "deactivated"}`);
      fetchToolkits();
    } catch (error) {
      console.error("Error toggling toolkit active status:", error);
      toast.error("Failed to update toolkit status");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Toolkits Management</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchToolkits} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading toolkits...</div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Lessons</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {toolkits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No toolkits found. Create your first toolkit!
                  </TableCell>
                </TableRow>
              ) : (
                toolkits.map((toolkit) => (
                  <TableRow key={toolkit.id}>
                    <TableCell className="max-w-xs">
                      <div className="truncate font-medium">
                        {toolkit.title}
                      </div>
                      <div className="text-muted-foreground truncate text-sm">
                        {toolkit.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      {toolkit.category && (
                        <Badge variant="secondary">{toolkit.category}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">₹{toolkit.price}</span>
                        {toolkit.originalPrice && (
                          <span className="text-muted-foreground text-sm line-through">
                            ₹{toolkit.originalPrice}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{toolkit.lessonCount || 0}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleToggleActive(toolkit.id, !toolkit.isActive)
                        }
                      >
                        {toolkit.isActive ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setManagingToolkit(toolkit);
                              setContentManagerOpen(true);
                            }}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Manage Content
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(toolkit)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleDelete(toolkit.id, toolkit.title)
                            }
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Toolkit</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleUpdate)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter toolkit title" {...field} />
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
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter detailed description"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₹) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="299"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="originalPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Original Price (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="999"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter category" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Duration</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 2h 30m" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="lessonCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Lessons</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseInt(e.target.value, 10)
                              : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="coverImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Image URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube Promo Video URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://youtube.com/embed/..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="highlights"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Highlights (comma-separated)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Lifetime access, Downloadable resources, Certificate"
                        {...field}
                        value={field.value?.join(", ") ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <div className="text-muted-foreground text-sm">
                        Show this toolkit to users
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Toolkit</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {managingToolkit && (
        <ToolkitContentManager
          toolkitId={managingToolkit.id}
          toolkitTitle={managingToolkit.title}
          open={contentManagerOpen}
          onClose={() => setContentManagerOpen(false)}
          onUpdate={fetchToolkits}
        />
      )}
    </div>
  );
}
