"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import { addUtmParams, ensureAbsoluteUrl } from "@/lib/utils";
import { InternshipData } from "@/types/interfaces";

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

  const dmUrl = ensureAbsoluteUrl(internship.hiringManagerLinkedin);
  const emailSubject = `Applying for ${internship.title} role at ${internship.hiringOrganization}`;
  const mailUrl = `mailto:${internship.hiringManagerEmail || ""}?subject=${encodeURIComponent(emailSubject)}`;

  return (
    <footer className="pb-safe fixed right-0 bottom-0 left-0 z-[60] border-t border-slate-100 bg-white px-4 py-3 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
      {/* Dynamic Action Buttons */}
      <div className="flex items-center gap-2 w-full">
        {hasApply && (
          <Button asChild className="flex-1 h-11 rounded-xl border-none bg-[#ec5b13] hover:bg-[#d44d0c] font-bold text-white shadow-none transition-all active:scale-95 text-[11px] px-1 flex items-center justify-center gap-1">
            <Link
              href={addUtmParams(
                ensureAbsoluteUrl(internship.applyLink || internship.link),
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
              <span>Apply Directly</span>
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
