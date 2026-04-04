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

interface Opportunity {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  isActive: boolean;
  tags?: string[];
  images?: string[];
  attachments?: string[];
  location?: string;
  organiserInfo?: string;
  startDate?: string;
  endDate?: string;
  publishAt?: string;
  type:
    | "competitions_open_calls"
    | "case_competitions"
    | "hackathons"
    | "fellowships"
    | "ideathon_think_tanks"
    | "leadership_programs"
    | "awards_recognition"
    | "grants_scholarships"
    | "research_paper_ra_calls"
    | "upskilling_events";
  upvoteCount: number;
  upvoterIds: string[];
  user: {
    id: string;
    name: string;
    image: string;
  };
}

async function fetchAllOpportunities(): Promise<Opportunity[]> {
  const limit = 50;
  let offset = 0;
  let hasMore = true;
  const allOpportunities: Opportunity[] = [];

  while (hasMore) {
    const response = await axios.get<{
      opportunities: Opportunity[];
      pagination: {
        hasMore: boolean;
      };
    }>("/api/admin/opportunities", {
      params: {
        scope: "all",
        limit,
        offset,
      },
    });

    allOpportunities.push(...response.data.opportunities);
    hasMore = response.data.pagination?.hasMore ?? false;
    offset += limit;
  }

  return allOpportunities;
}

// Stable empty array to prevent unnecessary useMemo recomputation
const EMPTY_OPPORTUNITIES: Opportunity[] = [];

export default function OpportunityManagementTable() {
  const queryClient = useQueryClient();

  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);

  const handleEdit = async (opportunity: Opportunity) => {
    setLoadingEditId(opportunity.id);

    try {
      const response = await axios.get<{ opportunity: Opportunity }>(
        `/api/admin/opportunities/${opportunity.id}`
      );

      setOpen(false);
      setSelectedOpportunity(null);

      setTimeout(() => {
        setSelectedOpportunity(response.data.opportunity);
        setOpen(true);
      }, 50);
    } catch {
      toast.error("Failed to load opportunity details");
    } finally {
      setLoadingEditId(null);
    }
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-opportunity-management"],
    queryFn: fetchAllOpportunities,
  });

  const opportunities = data ?? EMPTY_OPPORTUNITIES;

  const columns = useMemo<ColumnDef<Opportunity>[]>(() => {
    const allSelected =
      opportunities.length > 0 && selectedIds.length === opportunities.length;

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
              <Button
                size="sm"
                onClick={() => handleEdit(opportunity)}
                disabled={loadingEditId === opportunity.id}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={togglingId === opportunity.id}
                aria-label={
                  opportunity.isActive ? "Hide opportunity" : "Show opportunity"
                }
                onClick={async () => {
                  setTogglingId(opportunity.id);
                  try {
                    await axios.patch(
                      `/api/admin/opportunities/${opportunity.id}`,
                      {
                        action: "toggle",
                      }
                    );
                    toast.success(
                      opportunity.isActive
                        ? "Opportunity hidden"
                        : "Opportunity is now visible"
                    );
                  } catch {
                    toast.error("Failed to update visibility.");
                  } finally {
                    setTogglingId(null);
                    queryClient.invalidateQueries({
                      queryKey: ["admin-opportunity-management"],
                    });
                  }
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
  }, [selectedIds, opportunities, queryClient, togglingId, loadingEditId]);

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
            <AlertDialogTitle>Delete Opportunities</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete selected opportunities?
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
                      axios.delete(`/api/admin/opportunities/${id}`)
                    )
                  );
                  const failed = results.filter(
                    (r) => r.status === "rejected"
                  ).length;
                  if (failed > 0) toast.error(`${failed} deletion(s) failed.`);
                  else toast.success("Deleted successfully");
                } finally {
                  setSelectedIds([]);
                  queryClient.invalidateQueries({
                    queryKey: ["admin-opportunity-management"],
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
          emptyMessage="No opportunities found"
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
