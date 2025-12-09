"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import Image from "next/image";
import { CheckCircle, XCircle } from "lucide-react";

type Opportunity = {
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
};

async function fetchPendingOpportunities(): Promise<{
    opportunities: Opportunity[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}> {
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
    const [approvingOpportunities, setApprovingOpportunities] = useState<Set<string>>(new Set());
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ["admin", "opportunities"],
        queryFn: fetchPendingOpportunities,
        staleTime: 1000 * 30, // 30 seconds
        retry: false,
    });

    // Handle 403 errors
    useEffect(() => {
        if (error && axios.isAxiosError(error) && error.response?.status === 403) {
            router.push("/");
            toast.error("You don't have permission to access this page");
        } else if (error && axios.isAxiosError(error) && error.response?.status !== 403) {
            toast.error("Failed to load pending opportunities");
        }
    }, [error, router]);

    const updateOpportunityMutation = useMutation({
        mutationFn: async ({ opportunityId, action }: { opportunityId: string; action: "approve" | "reject" }) => {
            const response = await axios.patch(`/api/admin/opportunities/${opportunityId}`, {
                action,
            });
            return { opportunityId, action, opportunity: response.data.opportunity };
        },
        onMutate: async ({ opportunityId }) => {
            setApprovingOpportunities((prev) => new Set(prev).add(opportunityId));
        },
        onSuccess: ({ opportunityId, action }) => {
            // Remove from the list since it's no longer pending
            queryClient.setQueryData<{
                opportunities: Opportunity[];
                pagination: { total: number; limit: number; offset: number; hasMore: boolean };
            }>(["admin", "opportunities"], (oldData) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    opportunities: oldData.opportunities.filter((opp) => opp.id !== opportunityId),
                    pagination: {
                        ...oldData.pagination,
                        total: oldData.pagination.total - 1,
                    },
                };
            });
            toast.success(`Opportunity ${action}d successfully`);
        },
        onError: (error) => {
            console.error("Error updating opportunity:", error);
            if (axios.isAxiosError(error)) {
                const message = error.response?.data?.error || "Failed to update opportunity";
                toast.error(message);
            } else {
                toast.error("Failed to update opportunity");
            }
            // Refetch to ensure consistency
            queryClient.invalidateQueries({ queryKey: ["admin", "opportunities"] });
        },
        onSettled: (_data, _error, { opportunityId }) => {
            setApprovingOpportunities((prev) => {
                const next = new Set(prev);
                next.delete(opportunityId);
                return next;
            });
        },
    });

    const handleApprove = (opportunityId: string) => {
        updateOpportunityMutation.mutate({ opportunityId, action: "approve" });
    };

    const handleReject = (opportunityId: string) => {
        updateOpportunityMutation.mutate({ opportunityId, action: "reject" });
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "No date";
        return new Date(dateString).toLocaleDateString();
    };

    const truncateText = (text: string, maxLength: number = 100) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <p className="text-muted-foreground">Loading pending opportunities...</p>
                </div>
            </div>
        );
    }

    const opportunities = data?.opportunities || [];
    const totalCount = data?.pagination?.total || 0;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Pending Opportunities</h2>
                <p className="text-muted-foreground">
                    Review and approve opportunities submitted by users
                </p>
            </div>

            <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-6">
                    <div className="mb-4">
                        <p className="text-sm text-muted-foreground">
                            Pending Requests: <span className="font-semibold">{totalCount}</span>
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Opportunity</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Posted by</TableHead>
                                    <TableHead>Date Range</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {opportunities.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No pending opportunities
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    opportunities.map((opportunity) => (
                                        <TableRow key={opportunity.id}>
                                            <TableCell>
                                                <div className="max-w-xs">
                                                    <p className="font-medium truncate">{opportunity.title}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {truncateText(opportunity.description)}
                                                    </p>
                                                    {opportunity.location && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            📍 {opportunity.location}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {opportunity.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {opportunity.user?.image ? (
                                                        <Image
                                                            src={opportunity.user.image}
                                                            alt={opportunity.user.name || "User avatar"}
                                                            className="size-6 rounded-full object-cover"
                                                            width={24}
                                                            height={24}
                                                        />
                                                    ) : (
                                                        <div className="flex size-6 items-center justify-center rounded-full border-2 border-neutral-300 bg-neutral-200 text-xs font-semibold text-neutral-600 uppercase">
                                                            {opportunity.user?.name
                                                                .split(" ")
                                                                .map((n) => n[0])
                                                                .join("")
                                                                .toUpperCase()
                                                                .slice(0, 2)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-medium">{opportunity.user?.name}</p>
                                                        <p className="text-xs text-muted-foreground capitalize">
                                                            {opportunity.user?.role || "user"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {opportunity.startDate ? (
                                                        <div>
                                                            <p>{formatDate(opportunity.startDate)}</p>
                                                            {opportunity.endDate && opportunity.endDate !== opportunity.startDate && (
                                                                <p className="text-muted-foreground">to {formatDate(opportunity.endDate)}</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-muted-foreground">No dates set</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(opportunity.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        onClick={() => handleApprove(opportunity.id)}
                                                        disabled={approvingOpportunities.has(opportunity.id)}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleReject(opportunity.id)}
                                                        disabled={approvingOpportunities.has(opportunity.id)}
                                                    >
                                                        <XCircle className="h-4 w-4 mr-1" />
                                                        Reject
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}
