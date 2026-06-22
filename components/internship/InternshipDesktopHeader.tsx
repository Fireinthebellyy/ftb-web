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
  Mail,
  Bell,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  cn,
  toTitleCase,
  formatSalary,
  formatDateLong,
  addUtmParams,
  ensureAbsoluteUrl,
} from "@/lib/utils";
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
  isCalendarAnimating?: boolean;
  onEditClick?: () => void;
  onAdminClick?: () => void;
  isAdminLoading?: boolean;
}

export const InternshipDesktopHeader: React.FC<
  InternshipDesktopHeaderProps
> = ({
  internship,
  session,
  isBookmarked,
  handleBookmarkClick,
  handleCalendarClick,
  isCalendarAnimating,
  onEditClick,
  onAdminClick,
  isAdminLoading,
}) => {
  const isOwner = session?.user && session.user.id === internship.user?.id;
  const isModerator =
    session?.user &&
    (session.user.role === "admin" || session.user.role === "editor");

  const hasApply = !!(internship.applyLink || internship.link);
  const hasDM = !!internship.hiringManagerLinkedin;
  const hasMail = !!internship.hiringManagerEmail;

  const dmUrl = ensureAbsoluteUrl(internship.hiringManagerLinkedin);
  const emailSubject = `Applying for ${internship.title} role at ${internship.hiringOrganization}`;
  const mailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(internship.hiringManagerEmail || "")}&su=${encodeURIComponent(emailSubject)}`;

  return (
    <div className="relative mb-8 rounded-[24px] border border-slate-100 bg-white px-8 py-5 shadow-sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          {/* Badges */}
          <div className="mb-5 flex flex-wrap gap-2.5">
            {internship.type && (
              <Badge className="rounded-full border-none bg-orange-50 px-3 py-1 text-[11px] font-bold tracking-wide text-[#ec5b13] uppercase shadow-none hover:bg-orange-100">
                {internship.type.replace(/-/g, " ")}
              </Badge>
            )}
            {internship.timing && (
              <Badge className="rounded-full border-none bg-orange-50 px-3 py-1 text-[11px] font-bold tracking-wide text-orange-600 uppercase shadow-none hover:bg-orange-100">
                {internship.timing.replace(/-/g, " ")}
              </Badge>
            )}
          </div>

          {/* Title & Company */}
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-[#1a1a1a] md:text-4xl">
            {toTitleCase(internship.title)}
          </h1>
          <h2 className="mb-6 text-xl font-bold text-[#ec5b13]">
            {toTitleCase(internship.hiringOrganization)}
          </h2>

          {/* Location, Salary, Duration */}
          <div className="flex flex-wrap items-center gap-6 text-[14px] font-medium text-slate-500">
            {internship.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>{toTitleCase(internship.location)}</span>
              </div>
            )}
            {internship.stipend !== null &&
              internship.stipend !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tracking-tight text-slate-400 uppercase">
                    Stipend:
                  </span>
                  <span>{formatSalary(internship.stipend)}</span>
                </div>
              )}
            {internship.duration && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>{toTitleCase(internship.duration)}</span>
              </div>
            )}
            {internship.deadline && (
              <div className="flex items-center gap-2">
                <CalendarPlus className="h-4 w-4 text-slate-400" />
                <span>Apply By: {formatDateLong(internship.deadline)}</span>
              </div>
            )}
          </div>

          {/* Utilities Row (Bookmark, Calendar, Edit, Admin) */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={handleBookmarkClick}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border-slate-200 p-0 transition-all focus:ring-0",
                isBookmarked
                  ? "border-orange-500 bg-orange-50 text-orange-500"
                  : "text-slate-500 hover:border-[#ec5b13] hover:bg-orange-50 hover:text-[#ec5b13]"
              )}
            >
              <Bookmark
                className={cn("h-4 w-4", isBookmarked && "fill-current")}
              />
            </Button>
            {isModerator && (
              <Button
                variant="outline"
                onClick={onAdminClick}
                disabled={isAdminLoading}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl border-slate-200 p-0 text-slate-500 transition-all hover:border-[#ec5b13] hover:bg-orange-50 hover:text-[#ec5b13] focus:ring-0"
                )}
                aria-label="Admin controls"
              >
                {isAdminLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Settings className="h-4.5 w-4.5" />
                )}
              </Button>
            )}
            {(isOwner || isModerator) && (
              <Button
                variant="outline"
                onClick={onEditClick}
                className="flex h-10 w-10 items-center justify-center rounded-xl border-slate-200 p-0 text-slate-500 transition-all hover:border-[#ec5b13] hover:bg-orange-50 hover:text-[#ec5b13] focus:ring-0"
                aria-label="Edit internship"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <div className="relative flex shrink-0">
              <button
                onClick={handleCalendarClick}
                className="relative flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:border-[#ec5b13] hover:bg-orange-50 hover:text-[#ec5b13] focus:ring-0"
                aria-label="Add to calendar"
              >
                {isCalendarAnimating && (
                  <div className="animate-slide-in-bell absolute inset-0 z-20 flex items-center justify-center bg-white dark:bg-zinc-950">
                    <Bell className="animate-ring-bell h-4 w-4 text-[#ec5b13]" />
                  </div>
                )}
                <div className="relative flex h-4.5 w-4.5 shrink-0 items-center justify-center">
                  <Image
                    src="/images/google-calendar.webp"
                    alt="Add to Google Calendar"
                    width={18}
                    height={18}
                    className="h-4.5 w-4.5 object-contain"
                  />
                </div>
              </button>
              <div className="pointer-events-none absolute -top-1 -right-1 z-30 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-[#ec5b13] text-white shadow-sm">
                <Bell className="h-2 w-2" strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Primary Action Buttons on the right */}
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {hasApply && (
            <Button
              asChild
              className="flex h-10 items-center gap-2 rounded-xl border-none bg-[#ec5b13] px-4 text-sm font-bold text-white shadow-none transition-all duration-200 hover:bg-[#d44d0c] active:scale-95"
            >
              <Link
                href={addUtmParams(
                  ensureAbsoluteUrl(internship.applyLink || internship.link),
                  "ftb_web"
                )}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  posthog.capture("internship_apply_forms_clicked", {
                    internship_id: internship.id,
                    title: internship.title,
                    url: internship.applyLink || internship.link,
                    source: "desktop_header",
                  })
                }
              >
                Apply Directly
              </Link>
            </Button>
          )}

          {hasDM && (
            <Button
              asChild
              className="flex h-10 items-center gap-2 rounded-xl border-none bg-[#0077b5] px-4 text-sm font-bold text-white shadow-none transition-all duration-200 hover:bg-[#005987] active:scale-95"
            >
              <Link
                href={dmUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  posthog.capture("internship_cold_dm_clicked", {
                    internship_id: internship.id,
                    title: internship.title,
                    source: "desktop_header",
                  })
                }
              >
                <Image
                  src="/images/linkedin.svg"
                  alt="LinkedIn"
                  width={16}
                  height={16}
                  className="h-4 w-4 object-contain brightness-0 invert"
                />
                Cold DM
              </Link>
            </Button>
          )}

          {hasMail && (
            <Button
              asChild
              className="flex h-10 items-center gap-2 rounded-xl border-none bg-black px-4 text-sm font-bold text-white shadow-none transition-all duration-200 hover:bg-zinc-800 active:scale-95"
            >
              <Link
                href={mailUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  posthog.capture("internship_cold_mail_clicked", {
                    internship_id: internship.id,
                    title: internship.title,
                    source: "desktop_header",
                  })
                }
              >
                <Mail className="h-4 w-4" />
                Cold Mail
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Single Tab (Description) */}
      <div className="mt-6 flex items-center gap-8 border-b border-slate-100">
        <div className="relative pb-3 text-[15px] font-bold text-[#ec5b13]">
          Description
          <div className="absolute right-0 bottom-0 left-0 h-0.5 rounded-t-full bg-[#ec5b13]" />
        </div>
      </div>
    </div>
  );
};
