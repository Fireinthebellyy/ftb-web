"use client";

import React from "react";
import Image from "next/image";
import {
  GraduationCap,
  Building,
  Info,
  Lightbulb,
  Flag,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toTitleCase, formatSalary } from "@/lib/utils";
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
    <div className="px-6 pt-8 pb-12">
      {activeTab === "description" && (
        <div className="animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ec5b13]" />
            <h3 className="text-[17px] font-bold text-slate-900">
              Job Description
            </h3>
          </div>
          <div className="text-slate-600 leading-relaxed text-[15px] space-y-5">
            {typeof internship.description === "string" ? (
              <p className="whitespace-pre-wrap">{internship.description}</p>
            ) : (
              internship.description || <p>No description provided.</p>
            )}
            {internship.location && (
              <div className="mt-8 overflow-hidden rounded-3xl border border-slate-100 shadow-sm">
                <div className="relative h-52 w-full">
                  <Image
                    src="/images/map-placeholder.png"
                    alt="Company Location"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-blue-400/10" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-8 h-8 rounded-full bg-orange-500/30 animate-ping absolute scale-150" />
                    <div className="w-5 h-5 rounded-full bg-orange-500 border-2 border-white shadow-lg relative z-10" />
                  </div>
                </div>
                <div className="bg-[#fcfdfd] p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                      LOCATION
                    </h4>
                    <p className="text-[14px] text-slate-900 font-bold">
                      {toTitleCase(internship.location)}
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      internship.location
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#ec5b13] font-bold text-[13px] flex items-center gap-1 hover:underline"
                  >
                    Get Directions <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}
          </div>
          {internship.tags && internship.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 mb-4 text-[15px]">
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
      )}

      {activeTab === "requirements" && (
        <div className="animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ec5b13]" />
            <h3 className="text-[17px] font-bold text-slate-900">
              Requirements
            </h3>
          </div>
          {internship.eligibility && internship.eligibility.length > 0 ? (
            <ul className="space-y-3">
              {internship.eligibility.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-slate-600 bg-slate-50/70 p-4 rounded-2xl border border-slate-50"
                >
                  <div className="mt-0.5 p-1 bg-white rounded-lg border border-slate-100 shrink-0">
                    <GraduationCap className="w-4 h-4 text-[#ec5b13]" />
                  </div>
                  <span className="text-[14px] font-medium">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 italic">
              No specific eligibility criteria mentioned.
            </p>
          )}
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
            {internship.companyDescription ? (
              <p className="text-slate-600 text-[14px] leading-relaxed mb-5">
                {internship.companyDescription}
              </p>
            ) : (
              <p className="text-slate-600 text-[14px] leading-relaxed mb-5">
                {toTitleCase(internship.hiringOrganization)} is a leading
                organization in the industry, focused on delivering innovation
                and excellence.
              </p>
            )}
            {internship.website && (
              <Button
                variant="outline"
                className="w-full rounded-xl h-11 border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                onClick={() => window.open(internship.website!, "_blank")}
              >
                View Website
              </Button>
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
              { label: "Mentorship", value: "Guided by senior experts" },
              {
                label: "Experience Certificate",
                value: "Verified on completion",
              },
              { label: "Pre-placement Offer", value: "Performance based" },
            ].map((benefit, i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-0.5"
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

      {/* Disclaimer */}
      <div className="mt-12 pt-6 border-t border-slate-100">
        <div className="flex items-start gap-3 bg-slate-50/60 p-4 rounded-2xl mb-4">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-[13px] text-slate-500 leading-relaxed">
            Data on this page updates every 15 minutes. Listed by{" "}
            <b>{toTitleCase(internship.hiringOrganization)}</b>.
          </p>
        </div>
        <div className="flex items-center gap-5 pl-2">
          <button className="flex items-center gap-1.5 text-[#0066cc] font-bold text-[13px] hover:underline">
            <Lightbulb className="w-3.5 h-3.5" /> Complaint
          </button>
          <button className="flex items-center gap-1.5 text-[#ec5b13] font-bold text-[13px] hover:underline">
            <Flag className="w-3.5 h-3.5" /> Report Issue
          </button>
        </div>
      </div>
    </div>
  );
};
