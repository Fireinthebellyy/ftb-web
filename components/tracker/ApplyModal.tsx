"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, Calendar, Wrench, ArrowRight, Check } from "lucide-react";
import { useTracker } from "../providers/TrackerProvider";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { type ApplyModalOpportunity } from "@/types/interfaces";

interface StepItemProps {
  index: number;
  title: string;
  description: string;
  icon: React.ElementType;
  isFill?: boolean;
}

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: ApplyModalOpportunity | null;
}

export default function ApplyModal({
  isOpen,
  onClose,
  opportunity,
}: ApplyModalProps) {
  const { addToTracker } = useTracker();
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveStep(0);
      setIsSubmitting(false);
      const t1 = setTimeout(() => setActiveStep(1), 600);
      const t2 = setTimeout(() => setActiveStep(2), 1100);
      const t3 = setTimeout(() => setActiveStep(3), 1600);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [isOpen]);

  if (!opportunity) return null;

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const oppId: number | string = opportunity.id;
      // Ensure persistence is awaited before closing or navigating
      await addToTracker({ 
        ...opportunity, 
        id: oppId,
        kind: opportunity.kind || "internship"
      }, "Not Applied");
      onClose();
      router.push("/tracker");
    } catch (error) {
      console.error("Failed to add to tracker:", error);
      toast.error("Failed to add to tracker. Please try again.");
      setIsSubmitting(false);
    }
  };

  const StepItem = ({
    index,
    title,
    description,
    icon: Icon,
    isFill = false,
  }: StepItemProps) => {
    const isDone = activeStep >= index;
    return (
      <div
        className={cn(
          "flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition-all duration-500 min-h-[5.5rem]",
          isDone ? "border-orange-100 bg-orange-50/40" : "border-transparent"
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl p-3 transition-all duration-500",
            isDone ? "bg-[#ec5b13] text-white" : "bg-orange-50 text-orange-500"
          )}
        >
          {isDone ? (
            <Check size={24} className="animate-in zoom-in duration-300" />
          ) : (
            <Icon
              size={24}
              className={cn(
                isFill ? "fill-orange-400 stroke-orange-500" : "stroke-orange-500"
              )}
            />
          )}
        </div>
        <div>
          <h4
            className={cn(
              "font-bold transition-colors duration-500",
              isDone ? "text-slate-900" : "text-slate-800"
            )}
          >
            {title}
          </h4>
          <p
            className={cn(
              "text-xs font-medium transition-colors duration-500",
              isDone ? "text-slate-500" : "text-slate-400"
            )}
          >
            {description}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="z-[70]"
        className="data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom fixed top-auto right-0 bottom-0 left-0 z-[80] w-full max-w-none translate-x-0 translate-y-0 gap-0 rounded-t-[32px] rounded-b-none border-none bg-[#FAFAF9] p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] text-black shadow-2xl focus:ring-0 focus:outline-none max-h-[90dvh] overflow-y-auto sm:top-[50%] sm:right-auto sm:bottom-auto sm:left-[50%] sm:w-full sm:max-w-sm sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-[32px]"
      >
        <div className="flex flex-col items-center pt-2">
          {/* Top handle bar */}
          <div className="mb-6 h-1 w-10 rounded-full bg-orange-200/50" />

          {/* Heading */}
          <DialogTitle className="mb-2 text-center text-2xl font-bold text-slate-900">
            Smart Apply
          </DialogTitle>
          <DialogDescription className="mb-8 text-center text-sm font-medium text-slate-500">
            10x your chances by applying smartly
          </DialogDescription>

          {/* Value Props */}
          <div className="w-full space-y-3">
            <StepItem
              index={1}
              title="Add to Tracker"
              description="Every application. One Dashboard. Zero Chaos."
              icon={LayoutGrid}
              isFill
            />
            <StepItem
              index={2}
              title="Add to Calendar"
              description="Deadlines synced. Mind freed. No slips, no stress."
              icon={Calendar}
            />
            <StepItem
              index={3}
              title="Access Toolkits"
              description="Become a hard-to-reject candidate - unfairly prepared."
              icon={Wrench}
              isFill
            />
          </div>

          {/* Footer CTA */}
          <div className="mt-8 flex w-full flex-col items-center gap-4">
            <div className="text-[13px] font-medium text-slate-500">
              2 extra minutes now {">"} getting ghosted later
            </div>
            <button
              onClick={handleSubmit}
              className={cn(
                "group flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-bold text-white shadow-lg transition-all active:scale-95",
                activeStep >= 3 && !isSubmitting
                  ? "bg-[#ec5b13] shadow-orange-500/30 hover:bg-[#d44d0c]"
                  : "bg-slate-300 shadow-none cursor-not-allowed"
              )}
              disabled={activeStep < 3 || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Proceed"}
              {!isSubmitting && (
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              )}
            </button>
          </div>

          <div className="mt-6 h-1 w-24 rounded-full bg-slate-200" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
