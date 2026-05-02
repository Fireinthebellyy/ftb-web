"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  CalendarPlus,
  Bookmark,
  Settings,
  Pencil,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, toTitleCase, formatSalary, formatDateLong, addUtmParams } from "@/lib/utils";
import { InternshipData } from "@/types/interfaces";
import posthog from "posthog-js";

interface UserSession {
  id: string;
  role?: "user" | "member" | "editor" | "admin";
}

interface InternshipDesktopHeaderProps {
  internship: InternshipData;
  session: { user: UserSession } | null;
  isBookmarked: boolean;
  handleBookmarkClick: () => void;
  handleCalendarClick: () => void;
  onSmartApplyClick: () => void;
  onEditClick?: () => void;
  onAdminClick?: () => void;
  isAdminLoading?: boolean;
}

export const InternshipDesktopHeader: React.FC<InternshipDesktopHeaderProps> = ({
  internship,
  session,
  isBookmarked,
  handleBookmarkClick,
  handleCalendarClick,
  onSmartApplyClick,
  onEditClick,
  onAdminClick,
  isAdminLoading,
}) => {
  const isOwner = session?.user && session.user.id === internship.user?.id;
  const isModerator = session?.user && (session.user.role === "admin" || session.user.role === "editor");
  return (
    <div className="bg-white rounded-[24px] px-8 py-5 shadow-sm border border-slate-100 relative mb-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div>
          {/* Badges */}
          <div className="flex flex-wrap gap-2.5 mb-5">
            {internship.type && (
              <Badge className="bg-orange-50 text-[#ec5b13] hover:bg-orange-100 border-none rounded-full px-3 py-1 font-bold text-[11px] uppercase shadow-none tracking-wide">
                {internship.type.replace(/-/g, " ")}
              </Badge>
            )}
            {internship.timing && (
              <Badge className="bg-orange-50 text-orange-600 hover:bg-orange-100 border-none rounded-full px-3 py-1 font-bold text-[11px] uppercase shadow-none tracking-wide">
                {internship.timing.replace(/-/g, " ")}
              </Badge>
            )}
          </div>

          {/* Title & Company */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1a1a1a] mb-2 tracking-tight">
            {toTitleCase(internship.title)}
          </h1>
          <h2 className="text-xl font-bold text-[#ec5b13] mb-6">
            {toTitleCase(internship.hiringOrganization)}
          </h2>

          {/* Location, Salary, Duration */}
          <div className="flex flex-wrap items-center gap-6 text-[14px] text-slate-500 font-medium">
            {internship.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{toTitleCase(internship.location)}</span>
              </div>
            )}
            {internship.stipend !== null && internship.stipend !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-tight">Stipend:</span>
                <span>{formatSalary(internship.stipend)}</span>
              </div>
            )}
            {internship.duration && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{toTitleCase(internship.duration)}</span>
              </div>
            )}
            {internship.deadline && (
              <div className="flex items-center gap-2">
                <CalendarPlus className="w-4 h-4 text-slate-400" />
                <span>Apply By: {formatDateLong(internship.deadline)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={handleBookmarkClick}
            className={cn(
              "w-12 h-12 p-0 flex items-center justify-center rounded-xl border-slate-200 transition-all focus:ring-0",
              isBookmarked
                ? "text-orange-500 border-orange-500 bg-orange-50"
                : "text-slate-500 hover:text-[#ec5b13] hover:border-[#ec5b13] hover:bg-orange-50"
            )}
          >
            <Bookmark
              className={cn("w-5 h-5", isBookmarked && "fill-current")}
            />
          </Button>
          {isModerator && (
            <Button
              variant="outline"
              onClick={onAdminClick}
              disabled={isAdminLoading}
              className={cn(
                "w-12 h-12 p-0 flex items-center justify-center rounded-xl border-slate-200 text-slate-500 hover:text-[#ec5b13] hover:border-[#ec5b13] hover:bg-orange-50 transition-all focus:ring-0"
              )}
              aria-label="Admin controls"
            >
              {isAdminLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Settings className="w-5 h-5" />
              )}
            </Button>
          )}
          {(isOwner || isModerator) && (
            <Button
              variant="outline"
              onClick={onEditClick}
              className="w-12 h-12 p-0 flex items-center justify-center rounded-xl border-slate-200 text-slate-500 hover:text-[#ec5b13] hover:border-[#ec5b13] hover:bg-orange-50 transition-all focus:ring-0"
              aria-label="Edit internship"
            >
              <Pencil className="w-5 h-5" />
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleCalendarClick}
            className="w-12 h-12 p-0 flex items-center justify-center rounded-xl border-slate-200 text-slate-500 hover:text-[#ec5b13] hover:border-[#ec5b13] hover:bg-orange-50 transition-all focus:ring-0"
          >
            <Image
              src="/images/google-calendar.webp"
              alt="Add to Google Calendar"
              width={20}
              height={20}
              className="w-5 h-5 object-contain"
            />
          </Button>
          {session?.user && (
            <Button
              onClick={() => {
                posthog.capture("internship_smart_apply_clicked", {
                  internship_id: internship.id,
                  title: internship.title,
                  source: "desktop_header",
                });
                onSmartApplyClick();
              }}
              className="h-12 px-6 rounded-xl bg-[#ec5b13] hover:bg-[#d44d0c] text-white font-bold border-none shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all"
            >
              Smart Apply
            </Button>
          )}
          {(internship.applyLink || internship.link) && (
            <Link
              href={addUtmParams(internship.applyLink || internship.link || "", "ftb_web")}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                posthog.capture("internship_apply_now_clicked", {
                  internship_id: internship.id,
                  title: internship.title,
                  url: internship.applyLink || internship.link,
                  source: "desktop_header",
                })
              }
            >
              <Button className="h-12 px-8 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#ec5b13] font-bold border-none shadow-none transition-all">
                Apply Now
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Desktop Single Tab (Description) */}
      <div className="flex items-center gap-8 mt-6 border-b border-slate-100">
        <div className="pb-3 text-[15px] font-bold text-[#ec5b13] relative">
          Description
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ec5b13] rounded-t-full" />
        </div>
      </div>
    </div>
  );
};
