"use client";

import React from "react";
import { Info, Flag } from "lucide-react";
import { toTitleCase } from "@/lib/utils";

interface InternshipDisclaimerProps {
  organization: string | undefined | null;
  isFlagging: boolean;
  isFlagged: boolean;
  onFlag: () => void;
  variant: "mobile" | "desktop";
}

export const InternshipDisclaimer: React.FC<InternshipDisclaimerProps> = ({
  organization,
  isFlagging,
  isFlagged,
  onFlag,
  variant,
}) => {
  const isMobile = variant === "mobile";

  return (
    <div
      className={
        isMobile
          ? "mt-8 border-t border-slate-200 pt-8 pb-4"
          : "mt-12 border-t border-slate-200 pt-8"
      }
    >
      <div
        className={`space-y-4 text-slate-700 ${
          isMobile ? "text-[13px]" : "text-[14px]"
        }`}
      >
        <div className="flex flex-wrap items-start gap-3">
          <Info
            className={`mt-0.5 shrink-0 text-slate-500 ${
              isMobile ? "h-4 w-4" : "h-4 w-4 text-slate-600"
            }`}
          />
          <p
            className={`flex-1 ${
              isMobile ? "leading-relaxed text-slate-500" : ""
            }`}
          >
            This opportunity has been listed by <b>{toTitleCase(organization)}</b>
            . FTB is not liable for any content mentioned in this opportunity or
            the process followed by the organizers for this opportunity.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <Flag
            className={`mt-0.5 shrink-0 text-red-600 ${
              isMobile ? "h-4 w-4" : "h-4 w-4 text-red-600"
            }`}
          />
          <button
            type="button"
            onClick={onFlag}
            disabled={isFlagging || isFlagged}
            className={`text-left font-semibold text-red-700 transition-colors hover:text-red-800 disabled:cursor-not-allowed disabled:text-red-300 ${
              isMobile ? "text-[13px]" : "text-[14px]"
            }`}
          >
            {isFlagging
              ? "Flagging internship..."
              : isFlagged
                ? "Internship flagged for review"
                : "Report this Internship"}
          </button>
        </div>
      </div>
    </div>
  );
};
