import React from "react";
import {
  CalendarCheck,
  CalendarPlus2,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { TrackerItem } from "@/components/providers/TrackerProvider";
import { differenceInCalendarDays, format } from "date-fns";

function formatDateDDMMYYYY(dateText: string) {
  const parsedDate = new Date(dateText);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateText;
  }

  return format(parsedDate, "dd/MM/yyyy");
}

function DeadlineBadge({ deadline }: { deadline: string }) {
  const daysDiff = differenceInCalendarDays(new Date(deadline), new Date());
  if (daysDiff < 0)
    return (
      <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
        Closed
      </span>
    );
  if (daysDiff === 0)
    return (
      <span className="animate-pulse rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600">
        Today!
      </span>
    );
  if (daysDiff <= 3)
    return (
      <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
        {daysDiff}d left
      </span>
    );
  if (daysDiff <= 7)
    return (
      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
        {daysDiff} days left
      </span>
    );
  return (
    <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-600">
      {daysDiff} days left
    </span>
  );
}

interface MobileTrackerCardProps {
  opp: TrackerItem;
  updateStatus: (
    id: number | string,
    status: string,
    extraData?: Record<string, unknown>
  ) => void;
  onDelete: (id: number | string) => void;
  onClick: (opp: TrackerItem) => void;
  onAddToCalendar: (opp: TrackerItem) => void;
  isCalendarAdded: boolean;
  isCalendarAdding: boolean;
}

export default function MobileTrackerCard({
  opp,
  updateStatus,
  onDelete,
  onClick,
  onAddToCalendar,
  isCalendarAdded,
  isCalendarAdding,
}: MobileTrackerCardProps) {
  const statuses = [
    "Not Applied",
    "Applied",
    "Result Awaited",
    "Selected",
    "Rejected",
  ];

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (newStatus === "Rejected") {
      const reason = prompt(
        "What do you think was the reason? (Resume, Interview, Ghosted?)"
      );
      if (reason) {
        updateStatus(opp.oppId, newStatus, { failureReason: reason });
        toast.message("💡 Suggestion", {
          description: reason.toLowerCase().includes("resume")
            ? "Check out the Resume Toolkit."
            : "Try the Mock Interview tool.",
        });
      } else {
        updateStatus(opp.oppId, newStatus);
      }
    } else {
      updateStatus(opp.oppId, newStatus);
    }
  };

  return (
    <div
      onClick={() => onClick(opp)}
      className="group relative cursor-pointer border-b border-slate-100 bg-white p-4 transition-colors active:bg-slate-50"
    >
      {/* Top Row: Logo, Info, and Delete */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3 pr-2">
          {opp.logo || opp.poster || opp.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={opp.logo || opp.poster || opp.images?.[0]}
              alt={opp.company}
              className="h-10 w-10 shrink-0 rounded-lg border border-slate-100 bg-white object-contain p-0.5"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-500">
              {opp.company ? opp.company.charAt(0) : "?"}
            </div>
          )}
          <div className="min-w-0">
            <h4 className="mb-0.5 truncate pr-1 text-base leading-tight font-bold text-slate-900">
              {opp.title}
            </h4>
            <p className="truncate text-xs font-medium text-slate-500">
              {opp.company}
            </p>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(opp.oppId);
          }}
          className="shrink-0 rounded-lg p-2 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
          title="Delete"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Bottom Row: Status and Metadata */}
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <div
          className="relative min-w-[140px] flex-1"
          onClick={(e) => e.stopPropagation()}
        >
          <select
            value={opp.status}
            onChange={handleStatusChange}
            className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-8 text-xs font-bold text-slate-700 transition-all focus:ring-2 focus:ring-orange-200 focus:outline-none"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400"
          />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {opp.deadline && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5">
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCalendar(opp);
                }}
                disabled={isCalendarAdding}
                className="shrink-0 text-slate-400 transition-colors hover:text-blue-600"
                title={
                  isCalendarAdded
                    ? "Added to Google Calendar"
                    : "Add to Google Calendar"
                }
              >
                {isCalendarAdded ? (
                  <CalendarCheck size={16} className="text-emerald-600" />
                ) : (
                  <CalendarPlus2
                    size={16}
                    className={isCalendarAdding ? "animate-pulse" : ""}
                  />
                )}
              </button>
              <span className="text-[10px] font-black tracking-wider whitespace-nowrap text-slate-600 uppercase">
                {formatDateDDMMYYYY(opp.deadline)}
              </span>
              {opp.kind === "opportunity" && (
                <DeadlineBadge deadline={opp.deadline} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
