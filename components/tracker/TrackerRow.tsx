import {
  Clock,
  AlertCircle,
  Trash2,
  ChevronDown,
  Calendar,
} from "lucide-react";
import clsx from "clsx";
import { TrackerItem } from "@/components/providers/TrackerProvider";
import { differenceInCalendarDays } from "date-fns";

function DeadlineBadge({ deadline }: { deadline: string }) {
  const daysDiff = differenceInCalendarDays(new Date(deadline), new Date());
  if (daysDiff < 0) {
    return (
      <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
        Closed
      </span>
    );
  }
  if (daysDiff === 0) {
    return (
      <span className="animate-pulse rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600">
        Deadline today!
      </span>
    );
  }
  if (daysDiff <= 3) {
    return (
      <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
        {daysDiff}d left
      </span>
    );
  }
  if (daysDiff <= 7) {
    return (
      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
        {daysDiff} days left
      </span>
    );
  }
  return (
    <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-600">
      {daysDiff} days left
    </span>
  );
}

interface TrackerRowProps {
  opp: TrackerItem & { isHighPriority?: boolean };
  updateStatus: (
    id: number | string,
    status: string,
    extraData?: Record<string, unknown>,
    kind?: "internship" | "opportunity"
  ) => void;
  onClick: (opp: TrackerItem) => void;
  onDelete: (id: number | string, kind?: "internship" | "opportunity") => void;
}

export default function TrackerRow({
  opp,
  updateStatus,
  onClick,
  onDelete,
}: TrackerRowProps) {
  return (
    <div
      onClick={() => onClick(opp)}
      className="group flex cursor-pointer flex-col gap-4 p-5 transition-colors hover:bg-slate-50 md:flex-row md:items-center"
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {opp.logo || opp.poster || opp.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={opp.logo || opp.poster || opp.images?.[0]}
            alt={opp.company}
            className="h-12 w-12 rounded-xl border border-slate-100 bg-white object-contain p-1"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-lg font-bold text-slate-500">
            {opp.company ? opp.company.charAt(0) : "?"}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="truncate font-bold text-slate-900">{opp.title}</h4>
            <span
              className={clsx(
                "rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                opp.fitColor
              )}
            >
              {opp.fitLabel}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-sm text-slate-500">
            <span>{opp.company}</span>
            {opp.deadline && (
              <span
                className={clsx(
                  "flex items-center gap-1",
                  opp.isHighPriority ? "font-bold text-rose-600" : ""
                )}
              >
                <Clock size={12} />{" "}
                {new Date(opp.deadline).toLocaleDateString()}
              </span>
            )}
            {opp.deadline && opp.kind === "opportunity" && (
              <DeadlineBadge deadline={opp.deadline} />
            )}
            {opp.expectedResultWindow && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Calendar size={12} /> Exp: {opp.expectedResultWindow}
              </span>
            )}
            {opp.isHighPriority && (
              <span className="flex items-center gap-1 rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600">
                <AlertCircle size={10} /> HIGH PRIORITY
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2 flex w-full items-center gap-2 md:mt-0 md:w-auto">
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <select
            value={opp.status}
            onChange={(e) =>
              updateStatus(opp.oppId, e.target.value, undefined, opp.kind)
            }
            className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-slate-200 focus:outline-none"
          >
            {[
              "Not Applied",
              "Applied",
              "Result Awaited",
              "Selected",
              "Rejected",
            ].map((s) => (
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
      </div>

      <div className="flex items-center gap-1">
        {opp.deadline && (
          <a
            href={`https://www.google.com/calendar/render?action=TEMPLATE&text=Deadline: ${encodeURIComponent(opp.title)}&dates=${new Date(opp.deadline).toISOString().replace(/-|:|\.\d\d\d/g, "")}/${new Date(opp.deadline).toISOString().replace(/-|:|\.\d\d\d/g, "")}&details=Company: ${encodeURIComponent(opp.company)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
            title="Add to Google Calendar"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/google-calendar.webp"
              alt="Google Calendar"
              className="h-5 w-5 object-contain"
            />
          </a>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(opp.oppId, opp.kind);
          }}
          className="rounded-lg p-2 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
          title="Remove from Tracker"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
