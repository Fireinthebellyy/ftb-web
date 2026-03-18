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

interface Opportunity {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

async function fetchAllOpportunities(): Promise<Opportunity[]> {
  const response = await axios.get<{ opportunities: Opportunity[] }>("/api/opportunities");
  return response.data.opportunities;
}

export default function OpportunityManagementTable() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-opportunity-management"],
    queryFn: fetchAllOpportunities,
  });

  const opportunities = data ?? [];

  const columns = useMemo<ColumnDef<Opportunity>[]>(() => {
    return [
      {
        accessorKey: "title",
        header: "Opportunity",
        cell: ({ row }) => {
          const opportunity = row.original;

          return (
            <div className="max-w-xs space-y-1">
              <p className="truncate font-medium">{opportunity.title}</p>
              <p className="text-muted-foreground truncate text-sm">
                {opportunity.description}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Type",
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
          const opportunity = row.original;

          return (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() =>
                  (window.location.href = `/admin/opportunities/edit/${opportunity.id}`)
                }
              >
                Edit
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    Delete
                  </Button>
                </AlertDialogTrigger>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Opportunity</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this opportunity?
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>

                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={async () => {
                        try {
                          await axios.delete(
                            `/api/admin/opportunities/${opportunity.id}`
                          );

                          toast.success("Opportunity deleted");

                          queryClient.invalidateQueries({
                            queryKey: ["admin-opportunity-management"],
                          });
                        } catch {
                          toast.error("Failed to delete opportunity");
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
      title="Opportunity Management"
      description="Search, edit or delete opportunities"
    >
      <AdminTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!opportunities.length}
        emptyMessage="No opportunities found"
        errorMessage="Failed to load opportunities"
      >
        <AdminDataTable
          tableId="opportunity-management"
          columns={columns}
          data={opportunities}
          emptyMessage="No opportunities found"
          filterColumnId="title"
          filterPlaceholder="Search opportunities"
        />
      </AdminTableState>
    </AdminTabLayout>
  );
}

