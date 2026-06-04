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
  onEditClick,
  onAdminClick,
  isAdminLoading,
}) => {
  const isOwner = session?.user && session.user.id === internship.user?.id;
  const isModerator = session?.user && (session.user.role === "admin" || session.user.role === "editor");

  const hasApply = !!(internship.applyLink || internship.link);
  const hasDM = !!internship.hiringManagerLinkedin;
  const hasMail = !!internship.hiringManagerEmail;

  const dmUrl = internship.hiringManagerLinkedin || "";
  const emailSubject = `Applying for ${internship.title} role at ${internship.hiringOrganization}`;
  const emailBody = `Hi ${internship.hiringManager || "Hiring Manager"},\n\nI hope you are doing well.\n\nI am writing to express my interest in the ${internship.title} internship role at ${internship.hiringOrganization}.\n\n[Add a brief 2-3 sentence introduction about your background, key skills, and why you are interested in this role]\n\nI would love the opportunity to discuss how my skills align with your team's needs. I have attached my resume for your review.\n\nBest regards,\n[Your Name]\n[Your Contact Information]\n[Your LinkedIn Profile]`;
  const mailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(internship.hiringManagerEmail || "")}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

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
          {hasApply && (
            <Button asChild className="h-12 px-5 rounded-xl bg-[#ec5b13] hover:bg-[#d44d0c] text-white font-bold border-none shadow-none transition-all active:scale-95 duration-200 flex items-center gap-2">
              <Link
                href={addUtmParams(internship.applyLink || internship.link || "", "ftb_web")}
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
                Apply Now
              </Link>
            </Button>
          )}

          {hasDM && (
            <Button asChild className="h-12 px-5 rounded-xl bg-[#0077b5] hover:bg-[#005987] text-white font-bold border-none shadow-none transition-all active:scale-95 duration-200 flex items-center gap-2">
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
                  className="w-4 h-4 object-contain brightness-0 invert"
                />
                Cold DM
              </Link>
            </Button>
          )}

          {hasMail && (
            <Button asChild className="h-12 px-5 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold border-none shadow-none transition-all active:scale-95 duration-200 flex items-center gap-2">
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
                <Mail className="w-4 h-4" />
                Cold Mail
              </Link>
            </Button>
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
