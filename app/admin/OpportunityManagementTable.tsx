"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { Eye, EyeOff, Trash2, CheckCircle, XCircle, SquarePen, Plus } from "lucide-react";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminTableState } from "@/components/admin/AdminTableState";
import { AdminTabLayout } from "@/components/admin/AdminTabLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";
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
  index?: number;
  id: string;
  title: string;
  description: string;
  createdAt: string;
  isActive: boolean;
  isVerified: boolean;
  isTrending?: boolean;
  isFeaturedHome?: boolean;
  trendingIndex?: number;
  featuredHomeIndex?: number;
  type: string;
  applyLink?: string;
  upvoteCount: number;
  upvoterIds: string[];
  user: {
    id: string;
    name: string;
    image: string;
    role?: "user" | "member" | "editor" | "admin";
  };
}

async function fetchAllOpportunities(): Promise<Opportunity[]> {
  const limit = 50;
  let offset = 0;
  let hasMore = true;
  const all: Opportunity[] = [];

  while (hasMore) {
    const response = await axios.get<{
      opportunities: Opportunity[];
      pagination: { hasMore: boolean };
    }>("/api/admin/opportunities", {
      params: { limit, offset, scope: "all" },
    });

    all.push(...response.data.opportunities);
    hasMore = response.data.pagination.hasMore;
    offset += limit;
  }

  return all;
}

const EMPTY_OPPORTUNITIES: Opportunity[] = [];

function OrangeCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
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
          <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1.5,6 4.5,9 10.5,3" />
          </svg>
        )}
      </span>
    </label>
  );
} 
  

export default function OpportunityManagementTable() {
  const queryClient = useQueryClient();

  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);

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
  const opportunities = [...(data ?? EMPTY_OPPORTUNITIES)].sort((a, b) => {
    return (a.trendingIndex ?? 9999) - (b.trendingIndex ?? 9999);
  });
  const handleApproveReject = async (
    opportunity: Opportunity,
    action: "approve" | "reject"
  ) => {
    setUpdatingIds((prev) => new Set(prev).add(opportunity.id));
    try {
      await axios.patch(`/api/admin/opportunities/${opportunity.id}`, { action });
      toast.success(action === "approve" ? "Opportunity approved!" : "Opportunity rejected!");
    } catch {
      toast.error(`Failed to ${action} opportunity`);
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(opportunity.id);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["admin-opportunity-management"] });
    }
  };
  
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
              if (e.target.checked) setSelectedIds(opportunities.map((o) => o.id));
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
        header: "Opportunity",
        cell: ({ row }) => {
          const opp = row.original;
          console.log(opp.title, opp.isVerified, typeof opp.isVerified)
          return (
            <div className="max-w-xs space-y-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium">{opp.title}</p>
                {opp.isVerified === false && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-400 text-xs">
                    Pending
                  </Badge>
                )}
                {opp.isVerified === true && (
                  <Badge variant="outline" className="text-green-600 border-green-400 text-xs">
                    Approved
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground truncate text-sm">
                {opp.description.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "applyLink",
        header: "Apply Link",
        cell: ({ row }) => {
          const opportunity = row.original;
          return (
            <input
              key={`applylink-${opportunity.id}-${opportunity.applyLink}`}
              type="text"
              defaultValue={opportunity.applyLink || ""}
              placeholder="Enter link"
              className="border rounded px-2 py-1 text-sm w-[180px]"
              onBlur={async (e) => {
                const value = e.target.value;
                try {
                  await axios.patch(`/api/admin/opportunities/${opportunity.id}`, { applyLink: value });
                  toast.success("Apply link updated");
                } catch {
                  toast.error("Failed to update link");
                } finally {
                  queryClient.invalidateQueries({ queryKey: ["admin-opportunity-management"] });
                }
              }}
            />
          );
        },
      },
      {
        accessorKey: "isTrending",
        header: "Trending",
        cell: ({ row }) => {
          const opportunity = row.original;
          return (
            <OrangeCheckbox
              checked={opportunity.isTrending ?? false}
              onChange={async () => {
                try {
                  await axios.patch(`/api/admin/opportunities/${opportunity.id}`, {
                    isTrending: !opportunity.isTrending,
                  });
                  toast.success(!opportunity.isTrending ? "Marked as trending" : "Removed from trending");
                } catch {
                  toast.error("Failed to update trending status");
                } finally {
                  queryClient.invalidateQueries({ queryKey: ["admin-opportunity-management"] });
                }
              }}
            />
          );
        },
      },
      
      {
        accessorKey: "isFeaturedHome",
        header: "Featured Home",
        cell: ({ row }) => {
          const opportunity = row.original;
          return (
            <OrangeCheckbox
              checked={opportunity.isFeaturedHome ?? false}
              onChange={async () => {
                try {
                  await axios.patch(`/api/admin/opportunities/${opportunity.id}`, {
                    isFeaturedHome: !opportunity.isFeaturedHome,
                  });
                  toast.success(!opportunity.isFeaturedHome ? "Featured on home" : "Removed from home");
                } catch {
                  toast.error("Failed to update featured status");
                } finally {
                  queryClient.invalidateQueries({ queryKey: ["admin-opportunity-management"] });
                }
              }}
            />
          );
        },
      },

      {
        accessorKey: "trendingIndex",
        header: "Trending Index",
        cell: ({ row }) => {
          const opportunity = row.original;
          return (
            <input
              key={`trendingindex-${opportunity.id}-${opportunity.trendingIndex}`}
              type="number"
              defaultValue={opportunity.trendingIndex ?? ""}
              className="border rounded px-2 py-1 text-sm w-[80px]"
              onBlur={async (e) => {
                const raw = e.target.value;
                    try {
                    await axios.patch(`/api/admin/opportunities/${opportunity.id}`, {
                      trendingIndex: raw === "" ? null : Number(raw),
                    });
                      queryClient.invalidateQueries({ queryKey: ["admin-opportunity-management"] });
                  } catch {
                  toast.error("Failed to save index");
                }
                
              }}
            />
          );
        },
      },
      {
        accessorKey: "featuredHomeIndex",
        header: "Featured Index",
        cell: ({ row }) => {
          const opportunity = row.original;
          return (
            <input
              key={`featuredhomeindex-${opportunity.id}-${opportunity.featuredHomeIndex}`}
              type="number"
              defaultValue={opportunity.featuredHomeIndex ?? ""}
              className="border rounded px-2 py-1 text-sm w-[80px]"
              onBlur={async (e) => {
                const raw = e.target.value;
                await axios.patch(`/api/admin/opportunities/${opportunity.id}`, {
                  featuredHomeIndex: raw === "" ? null : Number(raw),
                });
                queryClient.invalidateQueries({ queryKey: ["admin-opportunity-management"] });
              }}
            />
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
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const opportunity = row.original;
          const isUpdating = updatingIds.has(opportunity.id);
          const isPending = !opportunity.isVerified;

          return (
            <div className="flex items-center gap-2">
              {isPending ? (
                <>
                  <Button
                    size="sm"
                    disabled={isUpdating}
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApproveReject(opportunity, "approve")}
                  >
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isUpdating}
                    onClick={() => handleApproveReject(opportunity, "reject")}
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    Reject
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(opportunity)}>
                    <SquarePen className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(opportunity)}>
                    <SquarePen className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await axios.patch(`/api/admin/opportunities/${opportunity.id}`, { action: "toggle" });
                        toast.success(opportunity.isActive ? "Opportunity hidden" : "Opportunity is now visible");
                      } catch {
                        toast.error("Failed to update visibility.");
                      } finally {
                        queryClient.invalidateQueries({ queryKey: ["admin-opportunity-management"] });
                      }
                    }}
                  >
                    {opportunity.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
    ];
  }, [selectedIds, opportunities, queryClient, updatingIds]);

  const deleteToolbar =
    selectedIds.length > 0 ? (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
         onClick={async () => {
            const allHidden = selectedIds.every(
              (id) => !opportunities.find((o) => o.id === id)?.isActive
            );
            await Promise.allSettled(
              selectedIds.map((id) =>
                axios.patch(`/api/admin/opportunities/${id}`, { action: "toggle" })
              )
            );
            toast.success(allHidden ? `${selectedIds.length} opportunities unhidden` : `${selectedIds.length} opportunities hidden`);
            setSelectedIds([]);
            queryClient.invalidateQueries({ queryKey: ["admin-opportunity-management"] });
          }}
        >
          <EyeOff className="h-4 w-4" />
          {selectedIds.every((id) => !opportunities.find((o) => o.id === id)?.isActive)
            ? `Unhide (${selectedIds.length})`
            : `Hide (${selectedIds.length})`}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Trash2 className="h-4 w-4" />
              Delete ({selectedIds.length})
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Opportunities</AlertDialogTitle>
              <AlertDialogDescription>Are you sure?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  await Promise.allSettled(
                    selectedIds.map((id) => axios.delete(`/api/opportunities/${id}`))
                  );
                  setSelectedIds([]);
                  queryClient.invalidateQueries({ queryKey: ["admin-opportunity-management"] });
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
        title="Opportunity Management"
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Opportunity
          </Button>
        }
      >
        <AdminTableState isLoading={isLoading} isError={isError} isEmpty={!opportunities.length} emptyMessage="No opportunities found">
          <AdminDataTable
            columns={columns}
            data={opportunities}
            toolbarActions={deleteToolbar}
            emptyMessage="No opportunities found"
            filterFields={["title", "createdAt", "trendingIndex", "featuredHomeIndex", "index"]}
            filterPlaceholder="Search opportunities..."
          />
        </AdminTableState>
      </AdminTabLayout>

      <Dialog open={open} onOpenChange={setOpen}>
        {selectedOpportunity && (
          <DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden sm:max-w-2xl">
            <DialogTitle>Edit Opportunity</DialogTitle>
            <NewOpportunityForm opportunity={selectedOpportunity} onOpportunityCreated={() => { setOpen(false); queryClient.invalidateQueries({ queryKey: ["admin-opportunity-management"] }); }} />
          </DialogContent>
        )}
      </Dialog>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>Post Opportunity</DialogTitle>
          <NewOpportunityForm
            onOpportunityCreated={() => {
              setCreateOpen(false);
              queryClient.invalidateQueries({ queryKey: ["admin-opportunity-management"] });
            }}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
