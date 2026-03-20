"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, addUtmParams } from "@/lib/utils";
import { InternshipData } from "@/types/interfaces";

interface InternshipStickyFooterProps {
  internship: InternshipData;
  isBookmarked: boolean;
  session: { user: any } | null;
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
    <footer className="pb-safe fixed right-0 bottom-14 left-0 z-[60] flex items-center gap-2.5 border-t border-slate-100 bg-white px-4 py-3">
      <div className="flex shrink-0 items-center gap-2.5">
        <button
          onClick={handleBookmarkClick}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl border bg-white shadow-sm transition-all active:scale-95",
            isBookmarked
              ? "border-[#ea580c] text-[#ea580c]"
              : "border-slate-200 text-slate-700 hover:text-[#ea580c]"
          )}
        >
          <Bookmark className={cn("h-5 w-5", isBookmarked && "fill-current")} />
        </button>
        <button
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:text-[#ea580c] active:scale-95"
          onClick={handleCalendarClick}
        >
          <Image
            src="/images/google-calendar.webp"
            alt="Add to Google Calendar"
            width={20}
            height={20}
            className="h-5 w-5 object-contain"
          />
        </button>
      </div>

      {(internship.applyLink || internship.link) && (
        <Link
          href={addUtmParams(
            internship.applyLink || internship.link || "",
            "ftb_mobile"
          )}
          target="_blank"
          className="flex-1"
        >
          <Button className="h-12 w-full rounded-xl border-none bg-orange-50 px-0 font-bold text-[#ec5b13] shadow-none transition-all hover:bg-orange-100 active:scale-95">
            Apply Now
          </Button>
        </Link>
      )}

      {session?.user && (
        <Button
          onClick={onSmartApplyClick}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-none bg-[#ec5b13] px-0 text-[14px] font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-[#d44d0c] active:scale-95"
        >
          Smart Apply
        </Button>
      )}
    </footer>
  );
};
