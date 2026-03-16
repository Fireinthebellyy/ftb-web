"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { toTitleCase, formatDateLong } from "@/lib/utils";
import { InternshipData } from "@/types/interfaces";

interface InternshipDesktopSidebarProps {
  internship: InternshipData;
  handleOpenChat: () => void;
}

export const InternshipDesktopSidebar: React.FC<InternshipDesktopSidebarProps> = ({
  internship,
  handleOpenChat,
}) => {
  return (
    <div className="lg:col-span-1 space-y-6">
      <div className="bg-white rounded-[24px] p-7 shadow-sm border border-slate-100">
        <h4 className="text-[12px] font-bold text-slate-900 tracking-wider uppercase mb-5">
          JOB OVERVIEW
        </h4>
        <div className="space-y-4 text-[14px]">
          {internship.createdAt && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Posted On</span>
              <span className="font-semibold text-slate-900">
                {formatDateLong(internship.createdAt)}
              </span>
            </div>
          )}
          {internship.hiringOrganization && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500 shrink-0">Company</span>
              <span className="font-semibold text-slate-900 text-right line-clamp-1">
                {toTitleCase(internship.hiringOrganization)}
              </span>
            </div>
          )}
          {internship.hiringManager && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500 shrink-0">Hiring Manager</span>
              <span className="font-semibold text-slate-900 text-right line-clamp-1">
                {toTitleCase(internship.hiringManager)}
              </span>
            </div>
          )}

          {internship.tags && internship.tags.length > 0 && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500 shrink-0">Industry</span>
              <span className="font-semibold text-slate-900 text-right line-clamp-1">
                {toTitleCase(internship.tags[0])}
              </span>
            </div>
          )}
          {internship.experience && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500 shrink-0">Experience</span>
              <span className="font-semibold text-slate-900 text-right line-clamp-1">
                {toTitleCase(internship.experience)}
              </span>
            </div>
          )}
          {internship.deadline && (
            <div className="flex items-center justify-between pb-5 border-b border-slate-100">
              <span className="text-slate-500">Apply By</span>
              <span className="font-bold text-[#ec5b13]">
                {formatDateLong(internship.deadline)}
              </span>
            </div>
          )}
        </div>
        {internship.location && (
          <div className="mt-5 bg-slate-50/80 rounded-xl p-5">
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              LOCATION
            </h5>
            <p className="text-[14px] text-slate-700 font-medium">
              {toTitleCase(internship.location)}
            </p>
          </div>
        )}
      </div>

      {/* Need Help Card */}
      <div className="bg-[#fff6f0] border border-[#ffeadb] rounded-[24px] p-7">
        <h4 className="text-[16px] font-bold text-[#ec5b13] mb-2">
          Need Help?
        </h4>
        <p className="text-[14px] text-slate-600 mb-6 leading-relaxed">
          Have questions about the application process? Chat with our
          recruitment bot.
        </p>
        <Button
          variant="outline"
          onClick={handleOpenChat}
          className="w-full bg-transparent border-[#ec5b13] text-[#ec5b13] hover:bg-[#ec5b13] hover:text-white font-semibold h-11 rounded-xl transition-all text-[14px]"
        >
          Open Chat
        </Button>
      </div>
    </div>
  );
};
