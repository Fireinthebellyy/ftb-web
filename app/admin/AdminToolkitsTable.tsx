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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import ToolkitContentManager from "./ToolkitContentManager";
import { ToolkitFormFields } from "@/components/admin/ToolkitFormFields";
import { ToolkitTableRow } from "@/components/admin/ToolkitTableRow";
import {
  toolkitFormSchema,
  Toolkit,
  ToolkitFormValues,
} from "@/components/admin/types";
import NewToolkitModal from "@/components/toolkit/NewToolkitModal";
import { PlusCircle, RefreshCw } from "lucide-react";

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
      showSaleBadge: false,
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
      showSaleBadge: toolkit.showSaleBadge,
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

  const handleManageContent = (toolkit: Toolkit) => {
    setManagingToolkit(toolkit);
    setContentManagerOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Toolkits Management</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchToolkits}
            disabled={loading}
            title="Refresh toolkits"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <NewToolkitModal onSuccess={fetchToolkits}>
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Toolkit
            </Button>
          </NewToolkitModal>
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
                <TableHead>Sale Badge</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {toolkits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No toolkits found. Create your first toolkit!
                  </TableCell>
                </TableRow>
              ) : (
                toolkits.map((toolkit) => (
                  <ToolkitTableRow
                    key={toolkit.id}
                    toolkit={toolkit}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                    onManageContent={handleManageContent}
                  />
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
              <ToolkitFormFields control={form.control} />
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
