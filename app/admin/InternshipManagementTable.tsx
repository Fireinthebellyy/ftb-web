"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminTableState } from "@/components/admin/AdminTableState";
import { AdminTabLayout } from "@/components/admin/AdminTabLayout";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

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
}

async function fetchAllInternships(): Promise<Internship[]> {
  const response = await axios.get<{ internships: Internship[] }>("/api/internships");
  return response.data.internships;
}

export default function InternshipManagementTable() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-internship-management"],
    queryFn: fetchAllInternships,
  });

  const internships = data ?? [];

  const columns = useMemo<ColumnDef<Internship>[]>(() => {
    return [
      {
        accessorKey: "title",
        header: "Internship",
        cell: ({ row }) => {
          const internship = row.original;
          return (
            <div className="max-w-xs space-y-1">
              <p className="truncate font-medium">{internship.title}</p>
              <p className="text-muted-foreground truncate text-sm">
                {internship.description}
              </p>
            </div>
          );
        },
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
        enableSorting: false,
        cell: ({ row }) => {
          const internship = row.original;
          return (
            <div className="flex items-center gap-2">

              {/* Edit */}
              <Button
                size="sm"
                onClick={() =>
                  (window.location.href = `/admin/internships/edit/${internship.id}`)
                }
              >
                Edit
              </Button>

              {/* Hide / Unhide */}
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    await axios.patch(`/api/internships/${internship.id}`);
                    toast.success(
                      internship.isActive
                        ? "Internship hidden"
                        : "Internship visible"
                    );
                    queryClient.invalidateQueries({
                      queryKey: ["admin-internship-management"],
                    });
                    // ✅ also clear public page cache
                    queryClient.invalidateQueries({
                      queryKey: ["internships"],
                    });
                  } catch {
                    toast.error("Failed to update visibility");
                  }
                }}
              >
                {/* ✅ fixed icons */}
                {internship.isActive ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>

              {/* Delete */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Internship</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this internship? This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={async () => {
                        try {
                          await axios.delete(
                            `/api/internships/${internship.id}`
                          );
                          toast.success("Internship deleted");
                          queryClient.invalidateQueries({
                            queryKey: ["admin-internship-management"],
                          });
                          // ✅ also clear public page cache
                          queryClient.invalidateQueries({
                            queryKey: ["internships"],
                          });
                        } catch {
                          toast.error("Failed to delete internship");
                        }
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

            </div>
          );
        },
      },
    ];
  }, [queryClient]);

  return (
    <AdminTabLayout
      title="Internship Management"
      description="Search, edit, hide or delete internships"
    >
      <AdminTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!internships.length}
        emptyMessage="No internships found"
        errorMessage="Failed to load internships"
      >
        <AdminDataTable
          tableId="internship-management"
          columns={columns}
          data={internships}
          emptyMessage="No internships found"
          filterColumnId="title"
          filterPlaceholder="Search internships"
        />
      </AdminTableState>
    </AdminTabLayout>
  );
}