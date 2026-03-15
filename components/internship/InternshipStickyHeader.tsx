"use client";

import React from "react";
import { ArrowLeft, Calendar, Share2, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface InternshipStickyHeaderProps {
  onBack: () => void;
  onCalendar: () => void;
  onShare: () => void;
  onBookmark: () => void;
  isBookmarked: boolean;
}

export const InternshipStickyHeader: React.FC<InternshipStickyHeaderProps> = ({
  onBack,
  onCalendar,
  onShare,
  onBookmark,
  isBookmarked,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 h-14 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <span className="font-bold text-[16px] text-slate-900">
          Internship Detail
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onCalendar}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Add to calendar"
        >
          <Calendar className="w-5 h-5 text-slate-700" />
        </button>
        <button
          onClick={onShare}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Share"
        >
          <Share2 className="w-5 h-5 text-slate-700" />
        </button>
        <button
          onClick={onBookmark}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            isBookmarked
              ? "text-orange-500 bg-orange-50"
              : "text-slate-700 hover:bg-slate-100"
          )}
          aria-label="Bookmark"
          aria-pressed={isBookmarked}
        >
          <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-current")} />
        </button>
      </div>
    </header>
  );
};
