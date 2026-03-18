"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminTableState } from "@/components/admin/AdminTableState";
import { AdminTabLayout } from "@/components/admin/AdminTabLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Opportunity {
  id: string;
  type: string;
  title: string;
  description: string;
  location: string | null;
  organiserInfo: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  userId: string;
  user: {
    id: string;
    name: string;
    image: string | null;
    role: string;
  };
}

interface OpportunitiesResponse {
  opportunities: Opportunity[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

async function fetchPendingOpportunities(): Promise<OpportunitiesResponse> {
  const response = await axios.get<{
    success: boolean;
    opportunities: Opportunity[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }>("/api/admin/opportunities");

  return {
    opportunities: response.data.opportunities,
    pagination: response.data.pagination,
  };
}

export default function AdminOpportunitiesTable() {
  const [updatingOpportunities, setUpdatingOpportunities] = useState<
    Set<string>
  >(new Set());
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ["admin", "opportunities"],
    queryFn: fetchPendingOpportunities,
    staleTime: 1000 * 30,
    retry: false,
  });

  useEffect(() => {
    if (error && axios.isAxiosError(error) && error.response?.status === 403) {
      router.push("/");
      toast.error("You don't have permission to access this page");
      return;
    }

    if (error) {
      toast.error("Failed to load pending opportunities");
    }
  }, [error, router]);

  const updateOpportunityMutation = useMutation({
    mutationFn: async ({
      opportunityId,
      action,
    }: {
      opportunityId: string;
      action: "approve" | "reject";
    }) => {
      const response = await axios.patch(
        `/api/admin/opportunities/${opportunityId}`,
        {
          action,
        }
      );
      return { opportunityId, action, opportunity: response.data.opportunity };
    },
    onMutate: ({ opportunityId }) => {
      setUpdatingOpportunities((prev) => new Set(prev).add(opportunityId));
    },
    onSuccess: ({ opportunityId, action }) => {
      queryClient.setQueryData<OpportunitiesResponse>(
        ["admin", "opportunities"],
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            opportunities: oldData.opportunities.filter(
              (opportunity) => opportunity.id !== opportunityId
            ),
            pagination: {
              ...oldData.pagination,
              total: Math.max(0, oldData.pagination.total - 1),
            },
          };
        }
      );
      toast.success(`Opportunity ${action}d successfully`);
    },
    onError: (mutationError) => {
      if (axios.isAxiosError(mutationError)) {
        const message =
          mutationError.response?.data?.error || "Failed to update opportunity";
        toast.error(message);
      } else {
        toast.error("Failed to update opportunity");
      }
      queryClient.invalidateQueries({ queryKey: ["admin", "opportunities"] });
    },
    onSettled: (_data, _error, variables) => {
      setUpdatingOpportunities((prev) => {
        const next = new Set(prev);
        next.delete(variables.opportunityId);
        return next;
      });
    },
  });

  const opportunities = data?.opportunities ?? [];

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
              {opportunity.location ? (
                <p className="text-muted-foreground text-xs">
                  {opportunity.location}
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.type}
          </Badge>
        ),
      },
      {
        id: "user",
        accessorFn: (row) => row.user?.name,
        header: "Posted by",
        cell: ({ row }) => {
          const user = row.original.user;
          return (
            <div className="flex items-center gap-2">
              {user?.image ? (
                <div className="h-6 w-6 shrink-0 rounded-full">
                  <Image
                    src={user.image}
                    alt={user.name || "User avatar"}
                    className="h-6 w-6 rounded-full object-cover"
                    width={24}
                    height={24}
                  />
                </div>
              ) : (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-neutral-300 bg-neutral-200 text-xs font-semibold text-neutral-600 uppercase">
                  {user?.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
              )}
              <div>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-muted-foreground text-xs capitalize">
                  {user?.role || "user"}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: "dates",
        header: "Date Range",
        cell: ({ row }) => {
          const opportunity = row.original;
          if (!opportunity.startDate) {
            return (
              <p className="text-muted-foreground text-sm">No dates set</p>
            );
          }

          return (
            <div className="text-sm">
              <p>{new Date(opportunity.startDate).toLocaleDateString()}</p>
              {opportunity.endDate &&
              opportunity.endDate !== opportunity.startDate ? (
                <p className="text-muted-foreground">
                  to {new Date(opportunity.endDate).toLocaleDateString()}
                </p>
              ) : null}
            </div>
          );
        },
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
          const disabled = updatingOpportunities.has(opportunity.id);

          return (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() =>
                  updateOpportunityMutation.mutate({
                    opportunityId: opportunity.id,
                    action: "approve",
                  })
                }
                disabled={disabled}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-1 h-4 w-4" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() =>
                  updateOpportunityMutation.mutate({
                    opportunityId: opportunity.id,
                    action: "reject",
                  })
                }
                disabled={disabled}
              >
                <XCircle className="mr-1 h-4 w-4" />
                Reject
              </Button>
            </div>
          );
        },
      },
    ];
  }, [updateOpportunityMutation, updatingOpportunities]);

  return (
    <AdminTabLayout
      title="Pending Opportunities"
      description="Review and approve opportunities submitted by users"
      stats={
        <p className="text-muted-foreground text-sm">
          Pending requests:{" "}
          <span className="text-foreground font-medium">
            {data?.pagination.total ?? 0}
          </span>
        </p>
      }
    >
      <AdminTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!opportunities.length}
        emptyMessage="No pending opportunities"
        errorMessage="Failed to load pending opportunities"
      >
        <AdminDataTable
          tableId="opportunities"
          columns={columns}
          data={opportunities}
          emptyMessage="No pending opportunities"
          filterColumnId="title"
          filterPlaceholder="Search opportunities"
        />
      </AdminTableState>
    </AdminTabLayout>
  );
}
