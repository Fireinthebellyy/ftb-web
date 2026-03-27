"use client";

import React from "react";
import { MapPin } from "lucide-react";

import { formatSalary, toTitleCase } from "@/lib/utils";
import { InternshipData } from "@/types/interfaces";

interface InternshipHeroProps {
  internship: InternshipData;
}

export const InternshipHero: React.FC<InternshipHeroProps> = ({
  internship,
}) => {
  const hasStipend =
    internship.stipend !== null && internship.stipend !== undefined;

  return (
    <div className="bg-[#f8f9fa] px-5 pt-6 pb-6">
      <div className="flex flex-col items-center text-center">
        <h1 className="mb-1.5 text-[22px] leading-tight font-bold tracking-tight text-[#111827]">
          {toTitleCase(internship.title)}
        </h1>
        <h2 className="mb-3 text-[16px] font-bold text-[#ea580c]">
          {toTitleCase(internship.hiringOrganization)}
        </h2>

        <div className="mb-6 flex items-center justify-center gap-1.5 text-[13px] font-medium text-slate-500">
          <MapPin className="h-4 w-4" />
          <span>
            {internship.location ? toTitleCase(internship.location) : "Remote"}
          </span>
          <span className="font-bold text-slate-400">•</span>
          <span>
            {internship.type
              ? toTitleCase(internship.type.replace(/-/g, " "))
              : "Remote Friendly"}
          </span>
        </div>

        {/* Info Cards Grid */}
        <div
          className={`grid w-full gap-3 ${hasStipend ? "grid-cols-3" : "grid-cols-2"}`}
        >
          {hasStipend ? (
            <div className="flex flex-col items-start rounded-xl border border-orange-50 bg-white p-4 text-left shadow-sm">
              <span className="mb-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Salary
              </span>
              <span className="text-[15px] leading-tight font-extrabold text-[#111827]">
                {formatSalary(internship.stipend)}
              </span>
            </div>
          ) : null}

          <div className="flex flex-col items-start rounded-xl border border-orange-50 bg-white p-4 text-left shadow-sm">
            <span className="mb-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              Duration
            </span>
            <span className="text-[15px] leading-tight font-extrabold text-[#111827]">
              {internship.duration ? internship.duration : "6 \nMonths"}
            </span>
          </div>

          <div className="flex flex-col items-start rounded-xl border border-orange-50 bg-white p-4 text-left shadow-sm">
            <span className="mb-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              Type
            </span>
            <span className="text-[15px] leading-tight font-extrabold text-[#111827]">
              {internship.timing
                ? toTitleCase(internship.timing.replace("-", " "))
                : "Full-\ntime"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
