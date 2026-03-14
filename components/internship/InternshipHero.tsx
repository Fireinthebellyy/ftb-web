"use client";

import React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Building,
  MapPin,
  IndianRupee,
  CalendarDays,
} from "lucide-react";
import { toTitleCase, formatSalary } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { InternshipData } from "@/types/interfaces";

interface InternshipHeroProps {
  internship: InternshipData;
}

export const InternshipHero: React.FC<InternshipHeroProps> = ({ internship }) => {
  return (
    <div className="bg-white px-6 pt-10 pb-0">
      <div className="flex flex-col items-center text-center gap-4">
        {/* Logo */}
        <div className="w-20 h-20 bg-orange-50 rounded-[24px] flex items-center justify-center border border-orange-100 shadow-sm overflow-hidden">
          {internship.poster ? (
            <Image
              src={internship.poster}
              alt={internship.hiringOrganization}
              width={80}
              height={80}
              className="w-full h-full object-contain p-2"
            />
          ) : (
            <span className="text-2xl font-bold text-[#ec5b13]">
              {internship.hiringOrganization
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
          )}
        </div>

        <div className="w-full">
          <h1 className="text-[24px] font-extrabold text-[#1a1a1a] mb-1 leading-tight tracking-tight">
            {toTitleCase(internship.title)}
          </h1>
          <h2 className="text-[16px] font-bold text-[#ec5b13] mb-4">
            {toTitleCase(internship.hiringOrganization)}
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-x-2 text-[13px] text-slate-500 font-medium mb-5">
            {internship.location && (
              <>
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{toTitleCase(internship.location)}</span>
                <span className="mx-1">•</span>
              </>
            )}
            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Posted{" "}
              {internship.createdAt
                ? formatDistanceToNow(new Date(internship.createdAt), {
                    addSuffix: true,
                  })
                : "recently"}
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-2.5">
            {internship.type && (
              <Badge className="bg-orange-50 text-[#ec5b13] hover:bg-orange-100 border-none rounded-2xl px-4 py-2 font-bold text-[12px] flex items-center gap-1.5 shadow-sm">
                <Briefcase className="w-3.5 h-3.5" />
                {internship.type
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </Badge>
            )}
            {internship.timing && (
              <Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none rounded-2xl px-4 py-2 font-bold text-[12px] flex items-center gap-1.5 shadow-sm">
                <Building className="w-3.5 h-3.5" />
                {internship.timing
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </Badge>
            )}
            {internship.stipend !== null && internship.stipend !== undefined && (
              <Badge className="bg-orange-50 text-orange-600 hover:bg-orange-100 border-none rounded-2xl px-4 py-2 font-bold text-[12px] flex items-center gap-1.5 shadow-sm">
                <IndianRupee className="w-3.5 h-3.5" />
                {formatSalary(internship.stipend)}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
