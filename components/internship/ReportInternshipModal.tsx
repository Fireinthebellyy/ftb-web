"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Flag } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReportInternshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  internshipId: string;
  internshipTitle?: string;
  onReportSuccess: () => void;
}

const REPORT_REASONS = [
  {
    id: "expired",
    label: "Expired / Role already filled",
    description: "The position is no longer accepting applications.",
  },
  {
    id: "misleading",
    label: "Misleading or inaccurate details",
    description: "Incorrect stipend, duration, location, or requirements.",
  },
  {
    id: "scam",
    label: "Scam, fake, or suspicious listing",
    description: "Asks for money, sensitive info, or seems non-legitimate.",
  },
  {
    id: "broken_link",
    label: "Broken or invalid link",
    description: "Application URL leads to a 404 or non-existent page.",
  },
  {
    id: "other",
    label: "Other issue",
    description: "Any other problem not listed above.",
  },
];

export function ReportInternshipModal({
  isOpen,
  onClose,
  internshipId,
  internshipTitle,
  onReportSuccess,
}: ReportInternshipModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("expired");
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internshipId || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const chosenReasonObj = REPORT_REASONS.find((r) => r.id === selectedReason);
      const reasonCategory = chosenReasonObj ? chosenReasonObj.label : selectedReason;

      const response = await fetch(`/api/internships/${internshipId}/flag`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reasonCategory,
          description: description.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to submit report");
      }

      toast.success("Thank you for your feedback! Internship reported for review.");
      onReportSuccess();
      onClose();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to report internship";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-lg rounded-2xl p-6 sm:p-7 gap-0">
        <DialogHeader className="text-left space-y-2 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 shrink-0">
              <Flag className="h-4 w-4" />
            </div>
            <DialogTitle className="text-lg font-extrabold text-gray-900 leading-snug">
              Report Internship
            </DialogTitle>
          </div>
          {internshipTitle && (
            <DialogDescription className="text-xs font-semibold text-gray-500 line-clamp-1">
              {internshipTitle}
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Why are you reporting this listing? <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => {
                const isChecked = selectedReason === reason.id;
                return (
                  <label
                    key={reason.id}
                    onClick={() => setSelectedReason(reason.id)}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                      isChecked
                        ? "border-red-500 bg-red-50/40 ring-1 ring-red-500/20"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    )}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason.id}
                      checked={isChecked}
                      onChange={() => setSelectedReason(reason.id)}
                      className="mt-0.5 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                    />
                    <div className="space-y-0.5 text-left">
                      <div className="text-xs font-bold text-gray-900 leading-snug">
                        {reason.label}
                      </div>
                      <div className="text-[11px] text-gray-500 font-medium leading-normal">
                        {reason.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Additional Details (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail so our moderators can fix it..."
              className="w-full text-xs rounded-xl border border-gray-200 p-3 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-gray-900 placeholder:text-gray-400 resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
