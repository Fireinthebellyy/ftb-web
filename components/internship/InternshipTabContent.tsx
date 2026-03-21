"use client";

import React from "react";
import {
  Building,
  FileText,
} from "lucide-react";
import { formatSalary, toTitleCase } from "@/lib/utils";
import { InternshipData } from "@/types/interfaces";

interface InternshipTabContentProps {
  activeTab: string;
  internship: InternshipData;
}

export const InternshipTabContent: React.FC<InternshipTabContentProps> = ({
  activeTab,
  internship,
}) => {
  return (
    <div className="pt-2">
      {activeTab === "description" && (
        <div className="animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mb-3 px-1">
            <FileText className="w-5 h-5 text-[#ea580c]" />
            <h3 className="text-[18px] font-extrabold text-[#111827]">
              Description
            </h3>
          </div>
          
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            <div className="text-slate-600 leading-relaxed text-[15px] space-y-5">
              {typeof internship.description === "string" ? (
                <div className="whitespace-pre-wrap">
                  {internship.description}
                </div>
              ) : React.isValidElement(internship.description) || Array.isArray(internship.description) ? (
                <div>{internship.description as React.ReactNode}</div>
              ) : typeof internship.description === "object" && internship.description !== null ? (
                <div className="whitespace-pre-wrap text-[12px] font-mono bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {JSON.stringify(internship.description, null, 2)}
                </div>
              ) : (
                internship.description || <p>No description provided.</p>
              )}
            </div>

            {internship.tags && internship.tags.length > 0 && (
              <div className="mt-8 pt-5 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 mb-3 text-[15px]">
                  Skills & Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {internship.tags
                    .filter(
                      (tag) =>
                        !["remote", "onsite", "hybrid"].includes(tag.toLowerCase())
                    )
                    .map((tag, i) => (
                      <span
                        key={i}
                        className="bg-slate-50 text-slate-600 border border-slate-100 px-3.5 py-1.5 rounded-full text-[13px] font-bold"
                      >
                        {toTitleCase(tag)}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "company" && (
        <div className="animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ec5b13]" />
            <h3 className="text-[17px] font-bold text-slate-900">
              About the Company
            </h3>
          </div>
          <div className="bg-white rounded-[20px] border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100">
                <Building className="w-7 h-7 text-[#ec5b13]" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">
                  {toTitleCase(internship.hiringOrganization)}
                </h4>
                <p className="text-slate-500 text-sm">
                  {internship.location
                    ? toTitleCase(internship.location)
                    : "Global"}
                </p>
              </div>
            </div>
            <p className="text-slate-600 text-[14px] leading-relaxed mb-5">
              {toTitleCase(internship.hiringOrganization)} is a leading
              organization in the industry, focused on delivering innovation
              and excellence.
            </p>

            {internship.hiringManager && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                <div>
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Hiring Manager
                  </span>
                  <span className="text-[14px] font-medium text-slate-900">
                    {toTitleCase(internship.hiringManager)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "benefits" && (
        <div className="animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ec5b13]" />
            <h3 className="text-[17px] font-bold text-slate-900">
              Benefits & Perks
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {[
              {
                label: "Competitive Stipend",
                value: formatSalary(internship.stipend),
              },
              { 
                label: "Mentorship", 
                value: (internship as any).mentorship || "Guided by senior experts" 
              },
              {
                label: "Experience Certificate",
                value: (internship as any).experienceCertificate || "Verified on completion",
              },
              { 
                label: "Pre-placement Offer", 
                value: (internship as any).prePlacementOffer || "Performance based" 
              },
            ].map((benefit, i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-0.5"
              >
                <span className="text-[10px] font-bold text-[#ec5b13] uppercase tracking-wider">
                  {benefit.label}
                </span>
                <span className="text-[14px] font-bold text-slate-900">
                  {benefit.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
