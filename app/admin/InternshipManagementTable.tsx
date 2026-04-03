"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminTableState } from "@/components/admin/AdminTableState";
import { AdminTabLayout } from "@/components/admin/AdminTabLayout";
import NewInternshipButton from "@/components/internship/NewInternshipButton";
import NewInternshipForm from "@/components/internship/NewInternshipForm";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface Internship {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  isActive: boolean;
  isFlagged: boolean;
  isHomepageFeatured?: boolean;
  homepageFeatureOrder?: number | null;
  user: {
    id: string;
    name: string;
  };
  hiringOrganization?: string;
  tags?: string[] | string;
  eligibility?: string;
  type?: "onsite" | "remote" | "hybrid";
  timing?: "full_time" | "part_time";
  location?: string;
  stipend?: number;
  hiringManager?: string;
  hiringManagerEmail?: string;
  experience?: string;
  duration?: string;
  link?: string;
  deadline?: string;
}

type FeaturedFilter = "all" | "featured" | "non-featured";

async function fetchAllInternships(): Promise<Internship[]> {
  const response = await axios.get<{ internships: Internship[] }>(
    "/api/internships"
  );
  return response.data.internships;
}

async function fetchInternshipById(id: string): Promise<Internship> {
  const response = await axios.get<{ internship: Internship }>(
    `/api/internships/${id}`
  );
  return response.data.internship;
}

// Stable empty array to prevent unnecessary useMemo recomputation
const EMPTY_INTERNSHIPS: Internship[] = [];

interface InternshipManagementTableProps {
  canCreateInternship: boolean;
}

export default function InternshipManagementTable({
  canCreateInternship,
}: InternshipManagementTableProps) {
  const queryClient = useQueryClient();

  const [selectedInternship, setSelectedInternship] =
    useState<Internship | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);
  const [updatingFeaturedId, setUpdatingFeaturedId] = useState<string | null>(
    null
  );
  const [featuredFilter, setFeaturedFilter] =
    useState<FeaturedFilter>("all");

  const handleEdit = async (internship: Internship) => {
    setLoadingEditId(internship.id);
    try {
      const full = await fetchInternshipById(internship.id);
      setOpen(false);
      setSelectedInternship(null);
      setTimeout(() => {
        setSelectedInternship(full);
        setOpen(true);
      }, 50);
    } catch {
      toast.error("Failed to load internship details");
    } finally {
      setLoadingEditId(null);
    }
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-internship-management"],
    queryFn: fetchAllInternships,
  });

  const internships = data ?? EMPTY_INTERNSHIPS;
  const filteredInternships = useMemo(() => {
    if (featuredFilter === "featured") {
      return internships.filter((item) => Boolean(item.isHomepageFeatured));
    }

    if (featuredFilter === "non-featured") {
      return internships.filter((item) => !item.isHomepageFeatured);
    }

    return internships;
  }, [internships, featuredFilter]);

  const columns = useMemo<ColumnDef<Internship>[]>(() => {
    const visibleIds = filteredInternships.map((item) => item.id);
    const allSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedIds.includes(id));

    return [
      {
        id: "select",
        enableHiding: false,
        enableSorting: false,
        header: () => (
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedIds((prev) =>
                  Array.from(new Set([...prev, ...visibleIds]))
                );
              } else {
                setSelectedIds((prev) =>
                  prev.filter((id) => !visibleIds.includes(id))
                );
              }
            }}
          />
        ),
        cell: ({ row }) => {
          const id = row.original.id;
          return (
            <input
              type="checkbox"
              checked={selectedIds.includes(id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedIds((prev) => [...prev, id]);
                } else {
                  setSelectedIds((prev) => prev.filter((i) => i !== id));
                }
              }}
            />
          );
        },
      },
      {
        accessorKey: "title",
        header: "Internship",
      },
      {
        id: "user",
        accessorFn: (row) => row.user?.name,
        header: "Posted by",
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        accessorKey: "isFlagged",
        header: "Flagged",
        cell: ({ row }) => (
          <span
            className={cn(
              row.original.isFlagged
                ? "font-medium text-red-500"
                : "text-gray-400"
            )}
          >
            {row.original.isFlagged ? "Yes" : "No"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const internship = row.original;
          const isLoadingThis = loadingEditId === internship.id;

          return (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleEdit(internship)}
                disabled={isLoadingThis}
              >
                Edit
              </Button>

              <Button
                size="sm"
                variant="outline"
                aria-label={
                  internship.isActive ? "Hide internship" : "Show internship"
                }
                onClick={async () => {
                  try {
                    await axios.patch(`/api/internships/${internship.id}`);
                    toast.success(
                      internship.isActive
                        ? "Internship hidden"
                        : "Internship is now visible"
                    );
                  } catch {
                    toast.error("Failed to update visibility.");
                  } finally {
                    queryClient.invalidateQueries({
                      queryKey: ["admin-internship-management"],
                    });
                    queryClient.invalidateQueries({
                      queryKey: ["internships"],
                    });
                    queryClient.invalidateQueries({
                      queryKey: ["internships-home"],
                    });
                  }
                }}
              >
                {internship.isActive ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>

              <label className="ml-2 inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={Boolean(internship.isHomepageFeatured)}
                  disabled={updatingFeaturedId === internship.id}
                  onChange={async (e) => {
                    setUpdatingFeaturedId(internship.id);
                    try {
                      await axios.patch(`/api/internships/${internship.id}`, {
                        action: "set_featured",
                        isHomepageFeatured: e.target.checked,
                        homepageFeatureOrder: e.target.checked
                          ? (internship.homepageFeatureOrder ?? null)
                          : null,
                      });
                      toast.success(
                        e.target.checked
                          ? "Internship featured on homepage"
                          : "Internship removed from homepage"
                      );
                    } catch {
                      toast.error("Failed to update homepage featured setting.");
                    } finally {
                      setUpdatingFeaturedId(null);
                      queryClient.invalidateQueries({
                        queryKey: ["admin-internship-management"],
                      });
                      queryClient.invalidateQueries({
                        queryKey: ["internships-home"],
                      });
                    }
                  }}
                />
                <span>Featured</span>
              </label>

              <input
                type="number"
                min={1}
                defaultValue={internship.homepageFeatureOrder ?? ""}
                disabled={!internship.isHomepageFeatured || updatingFeaturedId === internship.id}
                placeholder="Order"
                className="h-8 w-20 rounded border border-input bg-background px-2 text-xs"
                onBlur={async (e) => {
                  if (!internship.isHomepageFeatured) return;
                  const raw = e.target.value.trim();
                  const parsed = raw ? Number.parseInt(raw, 10) : null;

                  if (raw && (!Number.isFinite(parsed) || (parsed ?? 0) < 1)) {
                    toast.error("Priority must be a number greater than 0.");
                    return;
                  }

                  if ((parsed ?? null) === (internship.homepageFeatureOrder ?? null)) {
                    return;
                  }

                  setUpdatingFeaturedId(internship.id);
                  try {
                    await axios.patch(`/api/internships/${internship.id}`, {
                      action: "set_featured",
                      isHomepageFeatured: true,
                      homepageFeatureOrder: parsed,
                    });
                    toast.success("Homepage priority updated.");
                  } catch {
                    toast.error("Failed to update homepage priority.");
                  } finally {
                    setUpdatingFeaturedId(null);
                    queryClient.invalidateQueries({
                      queryKey: ["admin-internship-management"],
                    });
                    queryClient.invalidateQueries({
                      queryKey: ["internships-home"],
                    });
                  }
                }}
              />
            </div>
          );
        },
      },
    ];
  }, [
    selectedIds,
    filteredInternships,
    queryClient,
    loadingEditId,
    updatingFeaturedId,
  ]);

  const deleteToolbar =
    selectedIds.length > 0 ? (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
            Delete ({selectedIds.length})
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Internships</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete selected internships?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={async () => {
                try {
                  const results = await Promise.allSettled(
                    selectedIds.map((id) =>
                      axios.delete(`/api/internships/${id}`)
                    )
                  );
                  const failed = results.filter(
                    (r) => r.status === "rejected"
                  ).length;
                  if (failed > 0) toast.error(`${failed} deletion(s) failed.`);
                  else toast.success("Deleted successfully");
                } catch (error) {
                  const message =
                    error instanceof Error
                      ? error.message
                      : "Unexpected error while deleting internships.";
                  toast.error(`Bulk delete failed: ${message}`);
                } finally {
                  setSelectedIds([]);
                  queryClient.invalidateQueries({
                    queryKey: ["admin-internship-management"],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["internships"],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["internships-home"],
                  });
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ) : null;

  const toolbarActions = (
    <>
      <select
        value={featuredFilter}
        onChange={(e) => setFeaturedFilter(e.target.value as FeaturedFilter)}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        aria-label="Filter internships by featured status"
      >
        <option value="all">All</option>
        <option value="featured">Featured</option>
        <option value="non-featured">Non-featured</option>
      </select>
      {deleteToolbar}
    </>
  );

  return (
    <>
      <AdminTabLayout
        title="Internship Management"
        description="Search, edit, hide or delete internships"
        actions={canCreateInternship ? <NewInternshipButton /> : null}
      >
        <AdminTableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!filteredInternships.length}
          emptyMessage="No internships found"
        >
          <AdminDataTable
            tableId="internship-management"
            columns={columns}
            data={filteredInternships}
            filterColumnId="title"
            filterPlaceholder="Search internships by title"
            emptyMessage="No internships found"
            toolbarActions={toolbarActions}
          />
        </AdminTableState>
      </AdminTabLayout>

      <Dialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (!val) setSelectedInternship(null);
        }}
      >
        {selectedInternship && (
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogTitle>Edit Internship</DialogTitle>
            <NewInternshipForm
              key={selectedInternship.id}
              internship={selectedInternship}
              onInternshipCreated={() => {
                setOpen(false);
                queryClient.invalidateQueries({
                  queryKey: ["admin-internship-management"],
                });
                queryClient.invalidateQueries({
                  queryKey: ["internships-home"],
                });
              }}
            />
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
