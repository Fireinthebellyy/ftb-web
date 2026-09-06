"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Flag, CheckCircle2, EyeOff, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ReportItem {
  id: string;
  reasonCategory: string;
  description: string | null;
  createdAt: string;
  reporter?: {
    id?: string;
    name?: string;
    email?: string;
  } | null;
}

interface InternshipReportsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  internshipId: string;
  internshipTitle?: string;
  hiringOrganization?: string;
  onRefetchInternships?: () => void;
}

export function InternshipReportsDialog({
  isOpen,
  onClose,
  internshipId,
  internshipTitle,
  hiringOrganization,
  onRefetchInternships,
}: InternshipReportsDialogProps) {
  const queryClient = useQueryClient();

  const {
    data: reports = [],
    isLoading,
  } = useQuery<ReportItem[]>({
    queryKey: ["internship-reports", internshipId],
    queryFn: async () => {
      if (!internshipId) return [];
      const res = await axios.get<{ reports: ReportItem[] }>(
        `/api/admin/internships/${internshipId}/reports`
      );
      return res.data.reports;
    },
    enabled: isOpen && Boolean(internshipId),
  });

  const unflagMutation = useMutation({
    mutationFn: async () => {
      await axios.delete(`/api/admin/internships/${internshipId}/reports`);
    },
    onSuccess: () => {
      toast.success("Internship unflagged & reports cleared!");
      queryClient.invalidateQueries({ queryKey: ["internships"] });
      if (onRefetchInternships) onRefetchInternships();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to unflag internship");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (newIsActive: boolean) => {
      await axios.put(`/api/internships/${internshipId}`, {
        isActive: newIsActive,
      });
    },
    onSuccess: (_, newIsActive) => {
      toast.success(newIsActive ? "Internship activated" : "Internship deactivated");
      queryClient.invalidateQueries({ queryKey: ["internships"] });
      if (onRefetchInternships) onRefetchInternships();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to update status");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-2xl rounded-2xl p-6 gap-0 max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="text-left space-y-1.5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600 shrink-0">
              <Flag className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-gray-900 leading-tight">
                Reported Issue Reasons
              </DialogTitle>
              {internshipTitle && (
                <DialogDescription className="text-xs font-semibold text-gray-600 mt-0.5">
                  {internshipTitle} {hiringOrganization ? `(${hiringOrganization})` : ""}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : reports.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-gray-800">No report entries found</p>
              <p className="text-xs text-gray-500">
                This listing was marked flagged, but has no detailed reason logs.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Submitted Reports ({reports.length})
              </div>
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="rounded-xl border border-red-100 bg-red-50/20 p-4 space-y-2 text-left"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-100/60 pb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                      {rep.reasonCategory}
                    </span>
                    <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {rep.createdAt ? format(new Date(rep.createdAt), "MMM dd, yyyy • hh:mm a") : "Recently"}
                    </span>
                  </div>

                  {rep.description ? (
                    <p className="text-xs text-gray-800 font-medium leading-relaxed bg-white/80 p-2.5 rounded-lg border border-red-100">
                      &quot;{rep.description}&quot;
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No description provided</p>
                  )}

                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-semibold pt-1">
                    <User className="h-3 w-3 text-gray-400" />
                    <span>Reported by:</span>
                    <span className="text-gray-700">
                      {rep.reporter?.name || "Anonymous Learner"}{" "}
                      {rep.reporter?.email ? `(${rep.reporter.email})` : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => toggleActiveMutation.mutate(false)}
            disabled={toggleActiveMutation.isPending}
            className="rounded-xl text-xs font-semibold text-gray-700 border-gray-200 hover:bg-gray-100 gap-1.5"
          >
            <EyeOff className="h-3.5 w-3.5" /> Deactivate Listing
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl text-xs font-semibold"
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => unflagMutation.mutate()}
              disabled={unflagMutation.isPending}
              className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {unflagMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Mark Resolved & Unflag
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
