"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Bookmark } from "lucide-react";
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
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 px-4 py-3 pb-safe flex items-center gap-2.5">
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={handleBookmarkClick}
          className={cn(
            "w-12 h-12 rounded-xl bg-white border shadow-sm flex items-center justify-center transition-all active:scale-95",
            isBookmarked
              ? "text-[#ea580c] border-[#ea580c]"
              : "text-slate-700 border-slate-200 hover:text-[#ea580c]"
          )}
        >
          <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-current")} />
        </button>
        <button
          className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 hover:text-[#ea580c] transition-all active:scale-95"
          onClick={handleCalendarClick}
        >
          <Image
            src="/images/google-calendar.webp"
            alt="Add to Google Calendar"
            width={20}
            height={20}
            className="w-5 h-5 object-contain"
          />
        </button>
      </div>
      
      {(internship.applyLink || internship.link) && (
        <Link
          href={`${internship.applyLink || internship.link}${
            (internship.applyLink || internship.link).includes("?") ? "&" : "?"
          }utm_source=ftb_mobile`}
          target="_blank"
          className="flex-1"
        >
          <Button
            className="w-full h-12 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#ec5b13] font-bold shadow-none active:scale-95 transition-all border-none px-0"
          >
            Apply Now
          </Button>
        </Link>
      )}

      {session?.user && (
        <Button
          onClick={onSmartApplyClick}
          className="h-12 flex-1 flex items-center gap-2 justify-center rounded-xl bg-[#ec5b13] hover:bg-[#d44d0c] text-white text-[14px] font-bold shadow-lg shadow-orange-500/20 active:scale-95 transition-all px-0 border-none"
        >
          Smart Apply
        </Button>
      )}
    </footer>
  );
};
