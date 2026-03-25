"use client";

import React from "react";
import { formatSalary, toTitleCase } from "@/lib/utils";
import { InternshipData } from "@/types/interfaces";
import { MapPin } from "lucide-react";

interface InternshipHeroProps {
  internship: InternshipData;
}

export const InternshipHero: React.FC<InternshipHeroProps> = ({ internship }) => {
  return (
    <div className="px-5 pt-6 pb-6 bg-[#f8f9fa]">
      <div className="flex flex-col items-center text-center">
        <h1 className="text-[22px] font-bold text-[#111827] mb-1.5 leading-tight tracking-tight">
          {toTitleCase(internship.title)}
        </h1>
        <h2 className="text-[16px] font-bold text-[#ea580c] mb-3">
          {toTitleCase(internship.hiringOrganization)}
        </h2>

        <div className="flex items-center justify-center gap-1.5 text-[13px] text-slate-500 font-medium mb-6">
          <MapPin className="w-4 h-4" />
          <span>{internship.location ? toTitleCase(internship.location) : "Remote"}</span>
          <span className="text-slate-400 font-bold">•</span>
          <span>{internship.type ? toTitleCase(internship.type.replace(/-/g, " ")) : "Remote Friendly"}</span>
        </div>

        {/* Info Cards Grid */}
        <div className={`grid ${internship.stipend !== null && internship.stipend !== undefined ? 'grid-cols-3' : 'grid-cols-2'} gap-3 w-full`}>
          {internship.stipend !== null && internship.stipend !== undefined && (
            <div className="bg-white rounded-xl p-4 flex flex-col items-start border border-orange-50 shadow-sm text-left">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">
                Salary
              </span>
              <span className="text-[15px] font-extrabold text-[#111827] leading-tight">
                {formatSalary(internship.stipend)}
              </span>
            </div>
          )}
          <div className="bg-white rounded-xl p-4 flex flex-col items-start border border-orange-50 shadow-sm text-left">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">
              Duration
            </span>
            <span className="text-[15px] font-extrabold text-[#111827] leading-tight">
              {internship.duration ? internship.duration : "6 \nMonths"}
            </span>
          </div>

          <div className="bg-white rounded-xl p-4 flex flex-col items-start border border-orange-50 shadow-sm text-left">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">
              Type
            </span>
            <span className="text-[15px] font-extrabold text-[#111827] leading-tight">
              {internship.timing ? toTitleCase(internship.timing.replace("-", " ")) : "Full-\ntime"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

