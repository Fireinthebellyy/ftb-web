"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface InternshipTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const InternshipTabs: React.FC<InternshipTabsProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className="flex items-center justify-between mt-8 overflow-x-auto border-b border-slate-100 -mx-6 px-6">
      {["Description"].map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab.toLowerCase())}
          className={cn(
            "pb-4 text-[13px] font-bold transition-all relative whitespace-nowrap",
            activeTab === tab.toLowerCase()
              ? "text-[#ec5b13]"
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          {tab}
          {activeTab === tab.toLowerCase() && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#ec5b13] rounded-t-full" />
          )}
        </button>
      ))}
    </div>
  );
};
