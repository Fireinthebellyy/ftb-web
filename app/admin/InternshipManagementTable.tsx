"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Eye, EyeOff, Trash2, SquarePen} from "lucide-react";
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
  is_trending?: boolean;
  is_featured_home?: boolean;
  trending_index?: number;
  featured_home_index?: number;
  display_index?: number | null;
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

async function fetchAllInternships(): Promise<Internship[]> {
  const response = await axios.get<{ internships: Internship[] }>("/api/internships");
  return response.data.internships;
}

async function fetchInternshipById(id: string): Promise<Internship> {
  const response = await axios.get<{ internship: Internship }>(`/api/internships/${id}`);
  return response.data.internship;
}

const EMPTY_INTERNSHIPS: Internship[] = [];

function OrangeCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="relative inline-flex cursor-pointer">
      <input type="checkbox" checked={checked} className="sr-only" onChange={onChange} />
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded border-2 transition-colors",
          checked
            ? "border-orange-500 bg-orange-500"
            : "border-gray-300 bg-white hover:border-orange-300"
        )}
      >
        {checked && (
          <svg
            className="h-3 w-3 text-white"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="1.5,6 4.5,9 10.5,3" />
          </svg>
        )}
      </span>
    </label>
  );
}

interface InternshipManagementTableProps {
  canCreateInternship: boolean;
}

export default function InternshipManagementTable({
  canCreateInternship,
}: InternshipManagementTableProps) {
  const queryClient = useQueryClient();

  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);

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

  const internships = [...(data ?? EMPTY_INTERNSHIPS)].sort((a, b) => {
    const aTrending = a.trending_index ?? 9999;
    const bTrending = b.trending_index ?? 9999;

    if (aTrending !== bTrending) return aTrending - bTrending;

    const aFeatured = a.featured_home_index ?? 9999;
    const bFeatured = b.featured_home_index ?? 9999;

    if (aFeatured !== bFeatured) return aFeatured - bFeatured;

    return (a.display_index ?? 9999) - (b.display_index ?? 9999);
  });

  const updateInternshipMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, unknown>;
    }) => {
      await axios.patch(`/api/internships/${id}`, payload);
    },
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-internship-management"] });
      const previous = queryClient.getQueryData<Internship[]>(["admin-internship-management"]);
      queryClient.setQueryData<Internship[]>(["admin-internship-management"], (old) =>
        old?.map((i) => {
          if (i.id !== id) return i;
          const mapped: any = { ...i };
          if (payload.isTrending !== undefined) mapped.is_trending = payload.isTrending;
          if (payload.isFeaturedHome !== undefined) mapped.is_featured_home = payload.isFeaturedHome;
          if (payload.isActive !== undefined) mapped.isActive = payload.isActive;
          return mapped;
        }) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["admin-internship-management"], context.previous);
      }
      toast.error("Failed to update internship");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-internship-management"] });
      queryClient.invalidateQueries({ queryKey: ["internships"] });
    },
  });

  const columns = useMemo<ColumnDef<Internship>[]>(() => {
    const allSelected =
      internships.length > 0 && selectedIds.length === internships.length;

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
              if (e.target.checked) setSelectedIds(internships.map((i) => i.id));
              else setSelectedIds([]);
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
                if (e.target.checked) setSelectedIds((prev) => [...prev, id]);
                else setSelectedIds((prev) => prev.filter((i) => i !== id));
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
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        accessorKey: "isFlagged",
        header: "Flagged",
        cell: ({ row }) => (
          <span className={cn(row.original.isFlagged ? "font-medium text-red-500" : "text-gray-400")}>
            {row.original.isFlagged ? "Yes" : "No"}
          </span>
        ),
      },
  
      {
        accessorKey: "is_trending",
        header: "Trending",
        cell: ({ row }) => {
          const internship = row.original;
          return (
            <OrangeCheckbox
              checked={internship.is_trending ?? false}
              onChange={() =>
                updateInternshipMutation.mutate({
                  id: internship.id,
                  payload: { isTrending: !internship.is_trending },
                })
              }
            />
          );
        },
      },
      {
        accessorKey: "is_featured_home",
        header: "Featured Home",
        cell: ({ row }) => {
          const internship = row.original;
          return (
            <OrangeCheckbox
              checked={internship.is_featured_home ?? false}
              onChange={() =>
                updateInternshipMutation.mutate({
                  id: internship.id,
                  payload: { isFeaturedHome: !internship.is_featured_home },
                })
              }
            />
          );
        },
      },
      {
      accessorKey: "trending_index",
      header: "Trending Index",
      cell: ({ row }) => {
        const internship = row.original;
        return (
          <input
            key={`trending-${internship.id}-${internship.trending_index}`}
            type="number"
            defaultValue={internship.trending_index ?? ""}
            className="border rounded px-2 py-1 text-sm w-[80px]"
            onBlur={async (e) => {
              const raw = e.target.value;
              try {
                await axios.patch(`/api/internships/${internship.id}`, {
                  trending_index: raw === "" ? null : Number(raw),
                });
                toast.success("Trending index updated");
              } catch {
                toast.error("Failed to update trending index");
              } finally {
                queryClient.invalidateQueries({
                  queryKey: ["admin-internship-management"],
                });
              }
            }}
          />
        );
      },
    },
    {
      accessorKey: "featured_home_index",
      header: "Featured Index",
      cell: ({ row }) => {
        const internship = row.original;
        return (
          <input
            key={`featured-${internship.id}-${internship.featured_home_index}`}
            type="number"
            defaultValue={internship.featured_home_index ?? ""}
            className="border rounded px-2 py-1 text-sm w-[80px]"
            onBlur={async (e) => {
              const raw = e.target.value;
              try {
                await axios.patch(`/api/internships/${internship.id}`, {
                  featured_home_index: raw === "" ? null : Number(raw),
                });
                toast.success("Featured index updated");
              } catch {
                toast.error("Failed to update featured index");
              } finally {
                queryClient.invalidateQueries({
                  queryKey: ["admin-internship-management"],
                });
              }
            }}
          />
        );
      },
    },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const internship = row.original;
          const isLoadingThis = loadingEditId === internship.id;
          return (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => handleEdit(internship)} disabled={isLoadingThis}>
                {isLoadingThis ? "Loading..." : <SquarePen className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                aria-label={internship.isActive ? "Hide internship" : "Show internship"}
                onClick={async () => {
                  try {
                    await axios.patch(`/api/internships/${internship.id}`);
                    toast.success(internship.isActive ? "Internship hidden" : "Internship is now visible");
                  } catch {
                    toast.error("Failed to update visibility.");
                  } finally {
                    await queryClient.refetchQueries({ queryKey: ["admin-internship-management"] });
                    await queryClient.refetchQueries({ queryKey: ["internships"] });
                  }
                }}
              >
                {internship.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </div>
          );
        },
      },
    ];
  }, [selectedIds, internships, queryClient, loadingEditId, updateInternshipMutation]);

 const deleteToolbar =
    selectedIds.length > 0 ? (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            const allHidden = selectedIds.every(
              (id) => !internships.find((i) => i.id === id)?.isActive
            );
          
            const results = await Promise.allSettled(
              selectedIds.map((id) =>
                axios.patch(`/api/internships/${id}`, {
                  isActive: allHidden,
                })
              )
            );
          
            const failed = results.filter((r) => r.status === "rejected");
          
            if (failed.length > 0) {
              toast.error(`${failed.length} updates failed`);
            } else {
              toast.success(
                allHidden
                  ? `${selectedIds.length} internships unhidden`
                  : `${selectedIds.length} internships hidden`
              );
            }
          
            setSelectedIds([]);
            queryClient.invalidateQueries({ queryKey: ["admin-internship-management"] });
            queryClient.invalidateQueries({ queryKey: ["internships"] });
          }}
        >
          <EyeOff className="h-4 w-4" />
          {selectedIds.every((id) => !internships.find((i) => i.id === id)?.isActive)
            ? `Unhide (${selectedIds.length})`
            : `Hide (${selectedIds.length})`}
        </Button>
        <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4 text-red-600" />
            Delete ({selectedIds.length})
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Internships</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete selected internships?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={async () => {
                try {
                  const results = await Promise.allSettled(
                    selectedIds.map((id) => axios.delete(`/api/internships/${id}`))
                  );
                  const failed = results.filter((r) => r.status === "rejected").length;
                  if (failed > 0) toast.error(`${failed} deletion(s) failed.`);
                  else toast.success("Deleted successfully");
                } catch (error) {
                  const message = error instanceof Error ? error.message : "Unexpected error.";
                  toast.error(`Bulk delete failed: ${message}`);
                } finally {
                  setSelectedIds([]);
                  queryClient.invalidateQueries({ queryKey: ["admin-internship-management"] });
                  queryClient.invalidateQueries({ queryKey: ["internships"] });
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    ) : null;

  return (
    <>
      <AdminTabLayout
        title="Internship Management"
        description="Search, edit, hide or delete internships"
        actions={canCreateInternship ? <NewInternshipButton /> : null}
      >
        <AdminTableState isLoading={isLoading} isError={isError} isEmpty={!internships.length} emptyMessage="No internships found">
          <AdminDataTable
            tableId="internship-management"
            columns={columns}
            data={internships}
            filterFields={["title", "createdAt", "trending_index", "featured_home_index"]}
            filterPlaceholder="Search by title, date, or index"
            emptyMessage="No internships found"
            toolbarActions={deleteToolbar}
          />
        </AdminTableState>
      </AdminTabLayout>

      <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) setSelectedInternship(null); }}>
        {selectedInternship && (
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogTitle>Edit Internship</DialogTitle>
            <NewInternshipForm
              key={selectedInternship.id}
              internship={selectedInternship}
              onInternshipCreated={() => {
                setOpen(false);
                queryClient.invalidateQueries({ queryKey: ["admin-internship-management"] });
                queryClient.invalidateQueries({ queryKey: ["internships"] });
              }}
            />
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
