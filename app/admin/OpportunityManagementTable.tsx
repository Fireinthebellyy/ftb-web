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

import NewOpportunityForm from "@/components/opportunity/NewOpportunityForm";

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

interface Opportunity {
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

async function fetchAllOpportunities(): Promise<Opportunity[]> {
  const response = await axios.get<{ opportunities: Opportunity[] }>(
    "/api/opportunities"
  );
  return response.data.opportunities;
}

export default function OpportunityManagementTable() {
  const queryClient = useQueryClient();

  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleEdit = (opportunity: Opportunity) => {
    setOpen(false);
    setSelectedOpportunity(null);

    setTimeout(() => {
      setSelectedOpportunity(opportunity);
      setOpen(true);
    }, 50);
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-opportunity-management"],
    queryFn: fetchAllOpportunities,
  });

  const opportunities = data ?? [];

  const columns = useMemo<ColumnDef<Opportunity>[]>(() => {
    const allSelected =
      opportunities.length > 0 &&
      selectedIds.length === opportunities.length;

    return [
      {
        id: "select",
        header: () => (
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedIds(opportunities.map((o) => o.id));
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
        header: "Opportunity",
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
          const opportunity = row.original;
          return (
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => handleEdit(opportunity)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await axios.patch(`/api/admin/opportunities/${opportunity.id}`, {
                    action: "toggle",
                  });
                  toast.success(
                    opportunity.isActive
                      ? "Opportunity hidden"
                      : "Opportunity is now visible"
                  );
                  queryClient.invalidateQueries({
                    queryKey: ["admin-opportunity-management"],
                  });
                }}
              >
                {opportunity.isActive ? (
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
  }, [selectedIds, opportunities, queryClient]);

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
          <AlertDialogTitle>Delete Opportunities</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete selected opportunities?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={async () => {
              await Promise.all(
                selectedIds.map((id) =>
                  axios.delete(`/api/opportunities/${id}`)
                )
              );
              setSelectedIds([]);
              toast.success("Deleted successfully");
              queryClient.invalidateQueries({
                queryKey: ["admin-opportunity-management"],
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
        title="Opportunity Management"
        description="Search, edit, hide or delete opportunities"
      >
        <AdminTableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!opportunities.length}
        >
          <AdminDataTable
            tableId="opportunity-management"
            columns={columns}
            data={opportunities}
            filterColumnId="title"
            filterPlaceholder="Search opportunities by title"
            emptyMessage="No opportunities found"
            toolbarActions={deleteToolbar}
          />
        </AdminTableState>
      </AdminTabLayout>

      <Dialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (!val) setSelectedOpportunity(null);
        }}
      >
        {selectedOpportunity && (
          <DialogContent>
            <DialogTitle>Edit Opportunity</DialogTitle>
            <NewOpportunityForm
              key={selectedOpportunity.id}
              opportunity={selectedOpportunity}
              onOpportunityCreated={() => {
                setOpen(false);
                queryClient.invalidateQueries({
                  queryKey: ["admin-opportunity-management"],
                });
              }}
            />
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}