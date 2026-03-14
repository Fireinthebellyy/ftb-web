"use client";

import React from "react";
import Link from "next/link";
import { Bookmark, CalendarPlus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InternshipData } from "@/types/interfaces";

interface InternshipStickyFooterProps {
  internship: InternshipData;
  isBookmarked: boolean;
  session: any;
  handleBookmarkClick: () => void;
  handleCalendarClick: () => void;
  onSmartApplyClick: () => void;
}

export const InternshipStickyFooter: React.FC<InternshipStickyFooterProps> = ({
  internship,
  isBookmarked,
  session,
  handleBookmarkClick,
  handleCalendarClick,
  onSmartApplyClick,
}) => {
  return (
    <footer className="fixed bottom-[56px] left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100 px-5 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={handleBookmarkClick}
          className={cn(
            "w-11 h-11 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center transition-all active:scale-95",
            isBookmarked
              ? "text-orange-500 border-orange-500"
              : "text-slate-500 hover:text-[#ec5b13]"
          )}
        >
          <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-current")} />
        </button>
        <button
          className="w-11 h-11 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-500 hover:text-[#ec5b13] transition-all active:scale-95"
          onClick={handleCalendarClick}
        >
          <CalendarPlus className="w-5 h-5" />
        </button>
      </div>
      {(internship.applyLink || internship.link) && (
        <Link
          href={`${internship.applyLink || internship.link}${
            (internship.applyLink || internship.link).includes("?") ? "&" : "?"
          }utm_source=ftb_mobile`}
          target="_blank"
          className="flex-1 ml-4"
        >
          <Button
            variant="outline"
            className="w-full h-13 rounded-[18px] border-orange-500 text-orange-600 hover:bg-orange-50 font-extrabold focus:ring-0 active:scale-95 transition-all"
          >
            Apply Now
          </Button>
        </Link>
      )}
      {session?.user && (
        <Button
          onClick={onSmartApplyClick}
          className="h-13 flex-1 ml-4 rounded-[18px] bg-[#ec5b13] hover:bg-[#d44d0c] text-white text-[15px] font-extrabold shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          Smart Apply
        </Button>
      )}
    </footer>
  );
};
