"use client";

import React from "react";
import { Info, Flag } from "lucide-react";
import { toTitleCase, cn } from "@/lib/utils";

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
      className={cn(
        isMobile
          ? "mt-8 border-t border-slate-200 pt-8 pb-4"
          : "mt-12 border-t border-slate-200 pt-8"
      )}
    >
      <div
        className={cn(
          "space-y-4 text-slate-700",
          isMobile ? "text-[13px]" : "text-[14px]"
        )}
      >
        <div className={cn("flex flex-wrap items-start gap-3")}> 
          <Info
            className={cn(
              "mt-0.5 shrink-0 text-slate-500",
              isMobile ? "h-4 w-4" : "h-4 w-4 text-slate-600"
            )}
          />
          <p
            className={cn(
              "flex-1",
              isMobile && "leading-relaxed text-slate-500"
            )}
          >
            {organization
              ? (<span>This opportunity has been listed by <b>{toTitleCase(organization)}</b>. </span>)
              : (<span>This opportunity has been listed by the organizer. </span>)}
            FTB is not liable for any content mentioned in this opportunity or
            the process followed by the organizers for this opportunity.
          </p>
        </div>
        <div className={cn("flex items-start gap-3")}> 
          <Flag
            className={cn(
              "mt-0.5 shrink-0 text-slate-500",
              isMobile ? "h-4 w-4" : "h-4 w-4 text-slate-600"
            )}
          />
          <button
            type="button"
            onClick={onFlag}
            disabled={isFlagging || isFlagged}
            className={`text-left font-medium text-slate-700 transition-colors hover:text-[#ec5b13] disabled:cursor-not-allowed disabled:text-slate-400 ${
              isMobile ? "text-[13px]" : "text-[14px]"
            }`}
          >
            {isFlagging
              ? "Flagging internship..."
              : isFlagged
                ? "Internship flagged for review"
                : "Flag this internship for review"}
          </button>
        </div>
      </div>
    </div>
  );
};
