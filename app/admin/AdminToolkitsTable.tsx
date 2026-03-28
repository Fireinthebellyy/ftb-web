"use client";

import { useCallback, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Edit,
  FolderCog,
  Loader2,
  PlusCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import ToolkitContentManager from "./ToolkitContentManager";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminTableState } from "@/components/admin/AdminTableState";
import { AdminTabLayout } from "@/components/admin/AdminTabLayout";
import { ToolkitFormFields } from "@/components/admin/ToolkitFormFields";
import {
  Toolkit,
  toolkitFormSchema,
  ToolkitFormValues,
} from "@/components/admin/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import NewToolkitModal from "@/components/toolkit/NewToolkitModal";
import {
  deleteStorageObjectClient,
  uploadFileViaSignedUrl,
} from "@/lib/storage/client";

async function fetchToolkits(): Promise<Toolkit[]> {
  const response = await axios.get<Toolkit[]>("/api/admin/toolkits");
  return response.data;
}

function formatHighlight(highlight: string) {
  const trimmed = highlight.trim();

  if (!trimmed) {
    return "";
  }

  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

export default function AdminToolkitsTable() {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingToolkit, setEditingToolkit] = useState<Toolkit | null>(null);
  const [contentManagerOpen, setContentManagerOpen] = useState(false);
  const [managingToolkit, setManagingToolkit] = useState<Toolkit | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [updatingActiveToolkitIds, setUpdatingActiveToolkitIds] = useState<
    Set<string>
  >(new Set());
  const queryClient = useQueryClient();

  const {
    data: toolkits = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["admin", "toolkits"],
    queryFn: fetchToolkits,
    staleTime: 1000 * 30,
  });

  const form = useForm<ToolkitFormValues>({
    resolver: zodResolver(toolkitFormSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      originalPrice: undefined,
      category: "",
      coverImageUrl: "",
      bannerImageUrl: "",
      videoUrl: "",
      totalDuration: "",
      highlights: [],
      testimonials: [],
      isActive: true,
      showSaleBadge: false,
    },
  });

  const updateToolkitMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, unknown>;
    }) => {
      await axios.put(`/api/admin/toolkits/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "toolkits"] });
    },
    onError: () => {
      toast.error("Failed to update toolkit");
    },
  });

  const deleteToolkitMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/admin/toolkits/${id}`);
    },
    onSuccess: () => {
      toast.success("Toolkit deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "toolkits"] });
    },
    onError: () => {
      toast.error("Failed to delete toolkit");
    },
  });

  const handleEdit = useCallback(
    (toolkit: Toolkit) => {
      setEditingToolkit(toolkit);
      form.reset({
        title: toolkit.title,
        description: toolkit.description,
        price: toolkit.price,
        originalPrice: toolkit.originalPrice ?? undefined,
        category: toolkit.category ?? "",
        coverImageUrl: toolkit.coverImageUrl ?? "",
        bannerImageUrl: toolkit.bannerImageUrl ?? "",
        videoUrl: toolkit.videoUrl ?? "",
        totalDuration: toolkit.totalDuration ?? "",
        highlights: toolkit.highlights ?? [],
        testimonials: toolkit.testimonials ?? [],
        isActive: toolkit.isActive,
        showSaleBadge: toolkit.showSaleBadge,
      });
      setCoverImageFile(null);
      setBannerImageFile(null);
      setEditDialogOpen(true);
    },
    [form]
  );

  const handleUpdate = async (data: ToolkitFormValues) => {
    if (!editingToolkit) {
      return;
    }

    const currentCoverImageUrl = data.coverImageUrl?.trim() ?? "";
    if (!currentCoverImageUrl && !coverImageFile) {
      form.setError("coverImageUrl", {
        type: "manual",
        message: "Cover image is required",
      });
      return;
    }

    const uploadedKeys: string[] = [];

    try {
      let coverImageUrl = currentCoverImageUrl || undefined;
      let bannerImageUrl = data.bannerImageUrl?.trim() || undefined;

      if (coverImageFile) {
        const uploadedCover = await uploadFileViaSignedUrl({
          domain: "ungatekeep-images",
          file: coverImageFile,
        });
        coverImageUrl = uploadedCover.publicUrl;
        uploadedKeys.push(uploadedCover.key);
      }

      if (bannerImageFile) {
        const uploadedBanner = await uploadFileViaSignedUrl({
          domain: "ungatekeep-images",
          file: bannerImageFile,
        });
        bannerImageUrl = uploadedBanner.publicUrl;
        uploadedKeys.push(uploadedBanner.key);
      }

      const cleanedData = {
        ...data,
        coverImageUrl,
        bannerImageUrl,
        videoUrl: data.videoUrl || undefined,
        category: data.category || undefined,
        totalDuration: data.totalDuration || undefined,
        highlights:
          data.highlights?.map(formatHighlight).filter(Boolean) || undefined,
        testimonials: data.testimonials?.length
          ? data.testimonials.map((item) => ({
              name: item.name.trim(),
              role: item.role.trim(),
              message: item.message.trim(),
            }))
          : undefined,
      };

      await updateToolkitMutation.mutateAsync({
        id: editingToolkit.id,
        payload: cleanedData,
      });

      toast.success("Toolkit updated successfully");
      setCoverImageFile(null);
      setBannerImageFile(null);
      setEditDialogOpen(false);
    } catch (error) {
      await Promise.all(
        uploadedKeys.map((key) =>
          deleteStorageObjectClient("ungatekeep-images", key).catch(() => null)
        )
      );

      if (error instanceof Error) {
        toast.error(error.message);
        return;
      }

      toast.error("Failed to update toolkit");
    }
  };

  const handleEditDialogChange = (isOpen: boolean) => {
    setEditDialogOpen(isOpen);
    if (!isOpen) {
      setCoverImageFile(null);
      setBannerImageFile(null);
    }
  };

  const columns = useMemo<ColumnDef<Toolkit>[]>(() => {
    return [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div className="max-w-xs">
            <div className="truncate font-medium">{row.original.title}</div>
            <div className="text-muted-foreground truncate text-sm">
              {row.original.description}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) =>
          row.original.category ? (
            <Badge variant="secondary">{row.original.category}</Badge>
          ) : (
            <span>-</span>
          ),
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => (
          <span className="font-medium">INR {row.original.price}</span>
        ),
      },
      {
        accessorKey: "lessonCount",
        header: "Lessons",
        cell: ({ row }) => row.original.lessonCount || 0,
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={
              row.original.isActive
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-50"
            }
          >
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "active",
        header: "Active",
        enableSorting: false,
        cell: ({ row }) => {
          const toolkitId = row.original.id;
          const isUpdating = updatingActiveToolkitIds.has(toolkitId);

          return (
            <div className="flex items-center gap-2">
              <Switch
                checked={row.original.isActive}
                disabled={isUpdating}
                onCheckedChange={() => {
                  setUpdatingActiveToolkitIds((prev) => {
                    const next = new Set(prev);
                    next.add(toolkitId);
                    return next;
                  });

                  updateToolkitMutation.mutate(
                    {
                      id: toolkitId,
                      payload: { isActive: !row.original.isActive },
                    },
                    {
                      onSuccess: () => {
                        toast.success(
                          `Toolkit ${!row.original.isActive ? "activated" : "deactivated"}`
                        );
                      },
                      onSettled: () => {
                        setUpdatingActiveToolkitIds((prev) => {
                          const next = new Set(prev);
                          next.delete(toolkitId);
                          return next;
                        });
                      },
                    }
                  );
                }}
              />
              {isUpdating ? (
                <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "showSaleBadge",
        header: "Sale Badge",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0"
            onClick={() =>
              updateToolkitMutation.mutate(
                {
                  id: row.original.id,
                  payload: { showSaleBadge: !row.original.showSaleBadge },
                },
                {
                  onSuccess: () => {
                    toast.success(
                      `Sale badge ${!row.original.showSaleBadge ? "enabled" : "disabled"}`
                    );
                  },
                }
              )
            }
            title={
              row.original.showSaleBadge
                ? "Disable sale badge"
                : "Enable sale badge"
            }
          >
            <Badge
              className={
                row.original.showSaleBadge
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                  : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50"
              }
            >
              {row.original.showSaleBadge ? "Enabled" : "Disabled"}
            </Badge>
          </Button>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => {
          const toolkit = row.original;

          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setManagingToolkit(toolkit);
                  setContentManagerOpen(true);
                }}
                title="Manage content"
              >
                <FolderCog className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(toolkit)}
                title="Edit toolkit"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                title="Delete toolkit"
                onClick={() => {
                  if (
                    !confirm(
                      `Are you sure you want to delete "${toolkit.title}"?`
                    )
                  ) {
                    return;
                  }
                  deleteToolkitMutation.mutate(toolkit.id);
                }}
              >
                <Trash2 className="text-destructive h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ];
  }, [
    deleteToolkitMutation,
    handleEdit,
    updateToolkitMutation,
    updatingActiveToolkitIds,
  ]);

  return (
    <AdminTabLayout
      title="Toolkit Management"
      description="Manage toolkit catalog, pricing, and lesson content"
      actions={
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
            title="Refresh toolkits"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <NewToolkitModal
            onSuccess={() =>
              queryClient.invalidateQueries({ queryKey: ["admin", "toolkits"] })
            }
          >
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Toolkit
            </Button>
          </NewToolkitModal>
        </>
      }
      stats={
        <p className="text-muted-foreground text-sm">
          Total toolkits:{" "}
          <span className="text-foreground font-medium">{toolkits.length}</span>
        </p>
      }
    >
      <AdminTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!toolkits.length}
        emptyMessage="No toolkits found. Create your first toolkit."
        errorMessage="Failed to fetch toolkits"
      >
        <AdminDataTable
          tableId="toolkits"
          columns={columns}
          data={toolkits}
          emptyMessage="No toolkits found"
          filterColumnId="title"
          filterPlaceholder="Search toolkits"
        />
      </AdminTableState>

      <Dialog open={editDialogOpen} onOpenChange={handleEditDialogChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Toolkit</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleUpdate)}
              className="space-y-4"
            >
              <ToolkitFormFields
                control={form.control}
                coverImageFile={coverImageFile}
                bannerImageFile={bannerImageFile}
                onCoverImageFileSelect={setCoverImageFile}
                onBannerImageFileSelect={setBannerImageFile}
                onCoverImageRemove={() => {
                  setCoverImageFile(null);
                  form.setValue("coverImageUrl", "");
                }}
                onBannerImageRemove={() => {
                  setBannerImageFile(null);
                  form.setValue("bannerImageUrl", "");
                }}
                isSubmitting={updateToolkitMutation.isPending}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleEditDialogChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateToolkitMutation.isPending}
                >
                  {updateToolkitMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Toolkit"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {managingToolkit ? (
        <ToolkitContentManager
          toolkitId={managingToolkit.id}
          toolkitTitle={managingToolkit.title}
          open={contentManagerOpen}
          onClose={() => setContentManagerOpen(false)}
          onUpdate={() =>
            queryClient.invalidateQueries({ queryKey: ["admin", "toolkits"] })
          }
        />
      ) : null}
    </AdminTabLayout>
  );
}
