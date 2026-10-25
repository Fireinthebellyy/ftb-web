"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { Target } from "lucide-react";
import { useTracker } from "@/components/providers/TrackerProvider";
import { cn } from "@/lib/utils";

interface InternshipTrackerButtonProps {
  className?: string;
  tabIndex?: number;
}

export default function InternshipTrackerButton({
  className,
  tabIndex,
}: InternshipTrackerButtonProps) {
  const router = useRouter();
  const { items } = useTracker();

  const internshipCount = useMemo(
    () => items.filter((item) => item.kind === "internship").length,
    [items]
  );

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    posthog.capture("tracker_shortcut_clicked", {
      source: "internship_search_bar",
      count: internshipCount,
    });
    router.push("/tracker?tab=internship");
  };

  return (
    <button
      type="button"
      tabIndex={tabIndex}
      onClick={handleClick}
      title="Application Tracker"
      aria-label="Go to Application Tracker"
      className={cn(
        "relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xs transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:ring-2 focus:ring-slate-200 focus:outline-none active:scale-95",
        className
      )}
    >
      <Target className="h-5 w-5 transition-transform duration-200 group-hover:scale-105" />
    </button>
  );
}
