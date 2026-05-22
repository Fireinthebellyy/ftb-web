"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, MessageSquare, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, addUtmParams } from "@/lib/utils";
import { InternshipData } from "@/types/interfaces";
import posthog from "posthog-js";

interface InternshipStickyFooterProps {
  internship: InternshipData;
  isBookmarked: boolean;
  handleBookmarkClick: () => void;
  handleCalendarClick: () => void;
}

export const InternshipStickyFooter: React.FC<InternshipStickyFooterProps> = ({
  internship,
  isBookmarked,
  handleBookmarkClick,
  handleCalendarClick,
}) => {
  const dmKeywords = (internship.hiringManager ? `${internship.hiringManager} ` : "") + internship.hiringOrganization;
  const dmUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(dmKeywords)}`;

  const emailSubject = `Applying for ${internship.title} role at ${internship.hiringOrganization}`;
  const emailBody = `Hi ${internship.hiringManager || "Hiring Manager"},\n\nI hope you are doing well.\n\nI am writing to express my interest in the ${internship.title} internship role at ${internship.hiringOrganization}.\n\n[Add a brief 2-3 sentence introduction about your background, key skills, and why you are interested in this role]\n\nI would love the opportunity to discuss how my skills align with your team's needs. I have attached my resume for your review.\n\nBest regards,\n[Your Name]\n[Your Contact Information]\n[Your LinkedIn Profile]`;
  const mailUrl = `mailto:${internship.hiringManagerEmail || ""}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  return (
    <footer className="pb-safe fixed right-0 bottom-0 left-0 z-[60] flex flex-col gap-3 border-t border-slate-100 bg-white px-4 py-3 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
      {/* Top Row: The 3 Action Buttons */}
      <div className="grid grid-cols-3 gap-2 w-full">
        {(internship.applyLink || internship.link) && (
          <Link
            href={addUtmParams(
              internship.applyLink || internship.link || "",
              "ftb_mobile"
            )}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              posthog.capture("internship_apply_forms_clicked", {
                internship_id: internship.id,
                title: internship.title,
                url: internship.applyLink || internship.link,
                source: "mobile_footer",
              })
            }
          >
            <Button className="h-11 w-full rounded-xl border-none bg-gradient-to-r from-[#ec5b13] to-[#ff7d3b] hover:from-[#d44d0c] hover:to-[#ec5b13] font-bold text-white shadow-md shadow-orange-500/10 transition-all hover:bg-[#d44d0c] active:scale-95 text-[11px] px-1 flex items-center justify-center gap-1">
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Apply Forms</span>
            </Button>
          </Link>
        )}

        <Link
          href={dmUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            posthog.capture("internship_cold_dm_clicked", {
              internship_id: internship.id,
              title: internship.title,
              source: "mobile_footer",
            })
          }
        >
          <Button className="h-11 w-full rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold border border-sky-100 shadow-sm transition-all active:scale-95 text-[11px] px-1 flex items-center justify-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Cold DM</span>
          </Button>
        </Link>

        <Link
          href={mailUrl}
          target="_blank"
          onClick={() =>
            posthog.capture("internship_cold_mail_clicked", {
              internship_id: internship.id,
              title: internship.title,
              source: "mobile_footer",
            })
          }
        >
          <Button className="h-11 w-full rounded-xl bg-orange-50/50 hover:bg-orange-50 text-[#ec5b13] font-bold border border-orange-100 shadow-sm transition-all active:scale-95 text-[11px] px-1 flex items-center justify-center gap-1">
            <Mail className="h-3.5 w-3.5" />
            <span>Cold Mail</span>
          </Button>
        </Link>
      </div>

      {/* Bottom Row: Utilities (Bookmark & Calendar) */}
      <div className="flex items-center justify-between w-full border-t border-slate-50 pt-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Save & Plan</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleBookmarkClick}
            className={cn(
              "flex h-9 px-3 items-center gap-1.5 rounded-xl border bg-white shadow-sm transition-all active:scale-95 text-xs font-semibold",
              isBookmarked
                ? "border-[#ea580c] text-[#ea580c]"
                : "border-slate-200 text-slate-600 hover:text-[#ea580c]"
            )}
          >
            <Bookmark className={cn("h-3.5 w-3.5", isBookmarked && "fill-current")} />
            <span>{isBookmarked ? "Saved" : "Save"}</span>
          </button>
          <button
            className="flex h-9 px-3 items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:text-[#ea580c] active:scale-95 text-xs font-semibold"
            onClick={handleCalendarClick}
          >
            <Image
              src="/images/google-calendar.webp"
              alt="Add to Google Calendar"
              width={14}
              height={14}
              className="h-3.5 w-3.5 object-contain"
            />
            <span>Calendar</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
