"use client";

import React from "react";
import { Calendar, Clock, Video, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrackerEvent } from "../providers/TrackerProvider";
import { format } from "date-fns";

function formatDateDDMMYYYY(dateText: string) {
  const parsedDate = new Date(dateText);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateText;
  }

  return format(parsedDate, "dd/MM/yyyy");
}

interface EventCardProps {
  event: TrackerEvent;
  onDelete: (id: string) => void;
}

export default function EventCard({ event, onDelete }: EventCardProps) {
  const isDeadline = event.type === "Deadline";
  const isInterview = event.type === "Interview";

  // Colors based on type
  const getTheme = () => {
    if (isInterview) return "bg-purple-50 border-purple-200 text-purple-900";
    if (isDeadline) return "bg-amber-50 border-amber-200 text-amber-900";
    return "bg-slate-50 border-slate-200 text-slate-900";
  };

  const getIcon = () => {
    if (isInterview) return Video;
    if (isDeadline) return AlertCircle;
    return Calendar;
  };

  const Icon = getIcon();

  return (
    <div
      className={cn(
        "group relative flex items-start gap-4 rounded-xl border p-4",
        getTheme()
      )}
    >
      <div
        className={cn(
          "rounded-lg bg-white/60 p-2",
          isInterview
            ? "text-purple-600"
            : isDeadline
              ? "text-amber-600"
              : "text-slate-600"
        )}
      >
        <Icon size={20} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between">
          <h4 className="truncate pr-6 text-sm font-bold">{event.title}</h4>
        </div>

        <div className="mt-1 flex items-center gap-3 text-xs font-medium opacity-80">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            {formatDateDDMMYYYY(event.date)}
          </div>
        </div>

        {event.description && (
          <p className="mt-2 line-clamp-2 text-xs opacity-70">
            {event.description}
          </p>
        )}
      </div>

      <button
        onClick={() => onDelete(event.id)}
        aria-label="Delete event"
        className="absolute top-2 right-2 rounded-full p-1.5 text-slate-400 opacity-0 transition-all outline-none group-hover:opacity-100 hover:bg-black/5 hover:text-slate-600 focus:opacity-100 focus:ring-2 focus:ring-slate-400"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
