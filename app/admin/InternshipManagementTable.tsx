"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminTableState } from "@/components/admin/AdminTableState";
import { AdminTabLayout } from "@/components/admin/AdminTabLayout";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Trash2 } from "lucide-react";

import NewInternshipForm from "@/components/internship/NewInternshipForm";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

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
  user: {
    id: string;
    name: string;
  };
  // full fields for edit form
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

export default function InternshipManagementTable() {
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

  const internships = data ?? [];

  const columns = useMemo<ColumnDef<Internship>[]>(() => {
    const allSelected =
      internships.length > 0 &&
      selectedIds.length === internships.length;

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
                setSelectedIds(internships.map((i) => i.id));
              } else {
                setSelectedIds([]);
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
                {isLoadingThis ? "Loading..." : "Edit"}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await axios.patch(`/api/internships/${internship.id}`);
                  queryClient.invalidateQueries({
                    queryKey: ["admin-internship-management"],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["internships"],
                  });
                }}
              >
                {internship.isActive ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
            </div>
          );
        },
      },
    ];
  }, [selectedIds, internships, queryClient, loadingEditId]);

  const deleteToolbar = selectedIds.length > 0 ? (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
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
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={async () => {
              await Promise.all(
                selectedIds.map((id) =>
                  axios.delete(`/api/internships/${id}`)
                )
              );
              setSelectedIds([]);
              toast.success("Deleted successfully");
              queryClient.invalidateQueries({
                queryKey: ["admin-internship-management"],
              });
              queryClient.invalidateQueries({
                queryKey: ["internships"],
              });
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : null;

  return (
    <>
      <AdminTabLayout
        title="Internship Management"
        description="Search, edit, hide or delete internships"
      >
        <AdminTableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!internships.length}
        >
          <AdminDataTable
            tableId="internship-management"
            columns={columns}
            data={internships}
            filterColumnId="title"
            filterPlaceholder="Search internships by title"
            emptyMessage="No internships found"
            toolbarActions={deleteToolbar}
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
              }}
            />
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}