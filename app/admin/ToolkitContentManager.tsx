"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  GripVertical,
  Loader2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["link"],
    ["clean"],
  ],
};

const contentItemSchema = z
  .object({
    title: z.string().min(1, { message: "Title is required" }),
    isArticle: z.boolean().optional().default(false),
    isVideo: z.boolean().optional().default(false),
    content: z.string().optional(),
    bunnyVideoUrl: z.string().optional(),
    orderIndex: z.coerce.number().int().min(0).default(0),
  })
  .refine((data) => data.isArticle || data.isVideo, {
    message: "Select at least one type",
  });

type ContentItemFormValues = z.infer<typeof contentItemSchema>;

interface ContentItem {
  id: string;
  toolkitId: string;
  title: string;
  type: "article" | "video";
  content: string | null;
  bunnyVideoUrl: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

interface ToolkitContentManagerProps {
  toolkitId: string;
  toolkitTitle: string;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ToolkitContentManager({
  toolkitId,
  toolkitTitle,
  open,
  onClose,
  onUpdate,
}: ToolkitContentManagerProps) {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingContentItem, setEditingContentItem] =
    useState<ContentItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const form = useForm<ContentItemFormValues>({
    resolver: zodResolver(contentItemSchema),
    defaultValues: {
      title: "",
      isArticle: true,
      isVideo: false,
      content: "",
      bunnyVideoUrl: "",
      orderIndex: 0,
    },
  });

  const fetchContentItems = useCallback(async () => {
    if (!open) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `/api/admin/toolkits/${toolkitId}/content`
      );
      setContentItems(response.data);
    } catch (error) {
      console.error("Error fetching content items:", error);
      toast.error("Failed to fetch content items");
    } finally {
      setLoading(false);
    }
  }, [open, toolkitId]);

  useEffect(() => {
    fetchContentItems();
  }, [fetchContentItems]);

  const handleEdit = (contentItem: ContentItem) => {
    setEditingContentItem(contentItem);
    setIsAdding(false);
    form.reset({
      title: contentItem.title,
      isArticle: contentItem.type === "article",
      isVideo: contentItem.type === "video",
      content: contentItem.content ?? "",
      bunnyVideoUrl: contentItem.bunnyVideoUrl ?? "",
      orderIndex: contentItem.orderIndex,
    });
    setEditDialogOpen(true);
  };

  const handleAdd = () => {
    const maxOrderIndex =
      contentItems.length > 0
        ? Math.max(...contentItems.map((item) => item.orderIndex))
        : -1;

    setEditingContentItem(null);
    setIsAdding(true);
    form.reset({
      title: "",
      isArticle: true,
      isVideo: false,
      content: "",
      bunnyVideoUrl: "",
      orderIndex: maxOrderIndex + 1,
    });
    setEditDialogOpen(true);
  };

  const extractVideoUrl = (value: string): string => {
    if (value.includes("<iframe")) {
      const match = value.match(/src=["']([^"']*)["']/);
      if (match && match[1]) {
        return match[1];
      }
    }
    return value;
  };

  const normalizeQuillContent = (value: string): string => {
    const trimmed = value.trim();

    const decodeHtmlEntities = (input: string): string => {
      if (typeof window === "undefined") {
        return input;
      }

      const textarea = window.document.createElement("textarea");
      textarea.innerHTML = input;
      return textarea.value;
    };

    const withoutTags = trimmed.replace(/<[^>]*>/g, " ");
    const decodedText = decodeHtmlEntities(withoutTags)
      .replace(/&nbsp;|&#160;|&#xA0;/gi, " ")
      .replace(/\u00a0/g, " ");
    const normalizedText = decodedText.replace(/\s+/g, " ").trim();

    if (!normalizedText) {
      return "";
    }

    return trimmed;
  };

  const handleSave = async (data: ContentItemFormValues) => {
    try {
      const { isArticle, isVideo, content, bunnyVideoUrl, ...rest } = data;

      const payload = {
        ...rest,
        content: isArticle ? normalizeQuillContent(content ?? "") : "",
        bunnyVideoUrl: extractVideoUrl(bunnyVideoUrl || ""),
        type:
          isArticle && isVideo ? "article" : isArticle ? "article" : "video",
      };

      if (isAdding) {
        await axios.post(`/api/admin/toolkits/${toolkitId}/content`, payload);
        toast.success("Content item added successfully!");
      } else if (editingContentItem) {
        await axios.put(
          `/api/admin/toolkit-content-items/${editingContentItem.id}`,
          payload
        );
        toast.success("Content item updated successfully!");
      }

      setEditDialogOpen(false);
      fetchContentItems();
      onUpdate();
    } catch (error) {
      console.error("Error saving content item:", error);
      toast.error(
        isAdding
          ? "Failed to add content item"
          : "Failed to update content item"
      );
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${title}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await axios.delete(`/api/admin/toolkit-content-items/${id}`);
      toast.success("Content item deleted successfully!");
      fetchContentItems();
      onUpdate();
    } catch (error) {
      console.error("Error deleting content item:", error);
      toast.error("Failed to delete content item");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Manage Content: {toolkitTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Add and manage lessons and videos for this toolkit
            </p>
            <Button onClick={handleAdd} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Content
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
              <span className="sr-only">Loading content</span>
            </div>
          ) : contentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground mb-4">
                No content items yet. Add your first lesson or video!
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Order</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contentItems
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((contentItem) => (
                      <TableRow key={contentItem.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <GripVertical className="text-muted-foreground h-4 w-4" />
                            <span className="font-medium">
                              {contentItem.orderIndex + 1}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{contentItem.title}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {contentItem.type === "article" && (
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                                Article
                              </span>
                            )}
                            {contentItem.type === "video" && (
                              <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                                Video
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEdit(contentItem)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDelete(
                                    contentItem.id,
                                    contentItem.title
                                  )
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
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {isAdding ? "Add Content" : "Edit Content"}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSave)}
                className="flex max-h-[calc(85vh-10rem)] flex-col"
              >
                <div className="space-y-4 overflow-y-auto pr-1">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter content title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormItem>
                    <FormLabel>Content Type *</FormLabel>
                    <div className="flex gap-4">
                      <FormField
                        control={form.control}
                        name="isArticle"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4"
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Article
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="isVideo"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-y-0 space-x-3">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4"
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Video</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </FormItem>

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

                  {form.watch("isArticle") && (
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content {"*"}</FormLabel>
                          <FormControl>
                            <div className="[&_div.ql-container]:min-h-[220px] [&_div.ql-editor]:max-h-[35vh] [&_div.ql-editor]:min-h-[220px] [&_div.ql-editor]:overflow-y-auto">
                              <ReactQuill
                                theme="snow"
                                value={field.value ?? ""}
                                onChange={field.onChange}
                                modules={quillModules}
                                placeholder="Write article content..."
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch("isVideo") && (
                    <FormField
                      control={form.control}
                      name="bunnyVideoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Bunny CDN Video URL or Embed Code {"*"}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Paste full embed code or URL..."
                              className="min-h-[100px]"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value;
                                let videoUrl = value;

                                if (value.includes("<iframe")) {
                                  const match =
                                    value.match(/src=["']([^"']*)["']/);
                                  if (match && match[1]) {
                                    videoUrl = match[1];
                                  }
                                }

                                field.onChange(videoUrl);
                              }}
                            />
                          </FormControl>
                          <p className="text-muted-foreground text-sm">
                            Paste the full embed code (div + iframe) or just the
                            URL
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="mt-4 flex justify-end space-x-2 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
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
      </DialogContent>
    </Dialog>
  );
}
