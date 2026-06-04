"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addUtmParams } from "@/lib/utils";
import { InternshipData } from "@/types/interfaces";
import posthog from "posthog-js";

interface InternshipStickyFooterProps {
  internship: InternshipData;
}

export const InternshipStickyFooter: React.FC<InternshipStickyFooterProps> = ({
  internship,
}) => {
  const hasApply = !!(internship.applyLink || internship.link);
  const hasDM = !!internship.hiringManagerLinkedin;
  const hasMail = !!internship.hiringManagerEmail;

  if (!hasApply && !hasDM && !hasMail) return null;

  const dmUrl = internship.hiringManagerLinkedin || "";
  const emailSubject = `Applying for ${internship.title} role at ${internship.hiringOrganization}`;
  const emailBody = `Hi ${internship.hiringManager || "Hiring Manager"},\n\nI hope you are doing well.\n\nI am writing to express my interest in the ${internship.title} internship role at ${internship.hiringOrganization}.\n\n[Add a brief 2-3 sentence introduction about your background, key skills, and why you are interested in this role]\n\nI would love the opportunity to discuss how my skills align with your team's needs. I have attached my resume for your review.\n\nBest regards,\n[Your Name]\n[Your Contact Information]\n[Your LinkedIn Profile]`;
  const mailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(internship.hiringManagerEmail || "")}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  return (
    <footer className="pb-safe fixed right-0 bottom-0 left-0 z-[60] border-t border-slate-100 bg-white px-4 py-3 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
      {/* Dynamic Action Buttons */}
      <div className="flex items-center gap-2 w-full">
        {hasApply && (
          <Button asChild className="flex-1 h-11 rounded-xl border-none bg-[#ec5b13] hover:bg-[#d44d0c] font-bold text-white shadow-none transition-all active:scale-95 text-[11px] px-1 flex items-center justify-center gap-1">
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
              <span>Apply Now</span>
            </Link>
          </Button>
        )}

        {hasDM && (
          <Button asChild className="flex-1 h-11 rounded-xl border-none bg-[#0077b5] hover:bg-[#005987] font-bold text-white shadow-none transition-all active:scale-95 text-[11px] px-1 flex items-center justify-center gap-1">
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
              <Image
                src="/images/linkedin.svg"
                alt="LinkedIn"
                width={14}
                height={14}
                className="h-3.5 w-3.5 object-contain brightness-0 invert"
              />
              <span>Cold DM</span>
            </Link>
          </Button>
        )}

        {hasMail && (
          <Button asChild className="flex-1 h-11 rounded-xl border-none bg-black hover:bg-zinc-800 font-bold text-white shadow-none transition-all active:scale-95 text-[11px] px-1 flex items-center justify-center gap-1">
            <Link
              href={mailUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                posthog.capture("internship_cold_mail_clicked", {
                  internship_id: internship.id,
                  title: internship.title,
                  source: "mobile_footer",
                })
              }
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Cold Mail</span>
            </Link>
          </Button>
        )}
      </div>
    </footer>
  );
};
