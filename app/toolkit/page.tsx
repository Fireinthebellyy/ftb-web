"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import ToolkitCardNew from "@/components/toolkit/ToolkitCardNew";
import ToolkitComingSoonCard from "@/components/toolkit/ToolkitComingSoonCard";
import ToolkitStudentFeedback from "@/components/toolkit/ToolkitStudentFeedback";
import { Toolkit } from "@/types/interfaces";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ToolkitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const tabParam = searchParams?.get("tab");
  const initialTab = tabParam === "mentorship" ? "mentorship" : "toolkits";
  const [activeTab, setActiveTab] = useState<"toolkits" | "mentorship">(initialTab);

  const handleTabChange = (tab: "toolkits" | "mentorship") => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  const { data: toolkits = [], isLoading } = useQuery<Toolkit[]>({
    queryKey: ["toolkits"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/toolkits");
        return response.data;
      } catch (error) {
        console.error("Error fetching toolkits:", error);
        toast.error("Failed to load toolkits. Please try again later.");
        throw error;
      }
    },
    staleTime: 1000 * 60 * 10,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6 space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-lg border bg-white"
              >
                <div className="relative aspect-16/10">
                  <Skeleton className="h-full w-full rounded-none" />
                  <Skeleton className="absolute top-3 left-3 h-5 w-16 rounded-full" />
                  <Skeleton className="absolute top-3 right-3 h-5 w-12 rounded-full" />
                </div>

                <div className="space-y-2 p-3">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-6 w-11/12" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {activeTab === "toolkits" ? "Toolkits" : "Mentorship"}
            </h1>
            <p className="mt-1 text-gray-600">
                      {activeTab === "toolkits"
                        ? "Video guides with kickass strategies that actually work ~ go from overlooked to Top 1%"
                        : "1:1 mentorship sessions and guided help — rolling out soon. Request a session or check back later."}
            </p>
          </div>

          <div className="flex-shrink-0">
            <div className="bg-slate-100 p-1 rounded-lg flex items-center">
              <button
                onClick={() => handleTabChange("toolkits")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-bold transition-all flex justify-center items-center",
                  activeTab === "toolkits" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Toolkits
              </button>
              <button
                disabled
                aria-disabled="true"
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-bold transition-all flex justify-center items-center opacity-50 cursor-not-allowed",
                  activeTab === "mentorship" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                )}
              >
                Mentorship
              </button>
            </div>
          </div>
        </div>

        {activeTab === "toolkits" ? (
          toolkits.length === 0 ? (
            <div className="rounded-lg border bg-white py-12 text-center">
              <h3 className="mb-2 text-lg font-semibold text-gray-600">
                No toolkits found
              </h3>
              <p className="text-gray-500">Check back soon for new content!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {toolkits.map((toolkit) => (
                <ToolkitCardNew
                  key={toolkit.id}
                  toolkit={toolkit}
                  href={`/toolkit/${toolkit.id}`}
                />
              ))}
              {toolkits.length === 1 && <ToolkitComingSoonCard />}
            </div>
          )
        ) : (
          <div className="rounded-lg border bg-white p-8 text-center">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Mentorship (rolling out soon)</h3>
            <p className="text-gray-600 mb-4">We are launching 1:1 mentorship sessions and cohort guidance. Click below to chat with us on WhatsApp and get notified.</p>
            <div className="flex items-center justify-center">
              <a
                href={`https://wa.me/916377492042?text=${encodeURIComponent(
                  `Hi, I am interested in mentorship. Please notify me when it's available. Source: ${pathname || '/toolkit'}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-orange-600 text-white rounded-md font-bold hover:bg-orange-700"
              >
                Get notified
              </a>
            </div>
          </div>
        )}

        <ToolkitStudentFeedback />
      </div>
    </div>
  );
}
