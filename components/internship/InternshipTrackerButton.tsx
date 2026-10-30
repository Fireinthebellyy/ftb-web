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
        "group relative flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-xs transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:ring-2 focus:ring-slate-200 focus:outline-none active:scale-[0.98]",
        className
      )}
    >
      <Target className="h-4 w-4 text-orange-600 transition-transform duration-200 group-hover:scale-110" />
      <span className="font-semibold text-slate-800">Tracker</span>
      {internshipCount > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-100 px-1.5 text-xs font-bold text-orange-700">
          {internshipCount}
        </span>
      )}
    </button>
  );
}
