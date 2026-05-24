"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import ToolkitCardNew from "@/components/toolkit/ToolkitCardNew";
import ToolkitComingSoonCard from "@/components/toolkit/ToolkitComingSoonCard";
import ToolkitStudentFeedback from "@/components/toolkit/ToolkitStudentFeedback";
import { Toolkit } from "@/types/interfaces";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function ToolkitPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!sessionPending && !session) {
      router.replace(`/login?returnUrl=%2Ftoolkit`);
    }
  }, [session, sessionPending, router]);

  const { data: toolkits = [], isLoading, isError } = useQuery<Toolkit[]>({
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
    enabled: !!session?.user,
  });

  if (sessionPending || !session || isLoading) {
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

  const filteredToolkits = selectedCategory === "All"
    ? toolkits
    : toolkits.filter((t) => t.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Toolkits</h1>
          <p className="mt-2 text-gray-600">Video guides with kickass strategies that actually work ~ go from overlooked to Top 1%</p>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          {["All", "1:1 Mentorship", "Recorded toolkits", "digital products"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-medium transition-colors border",
                selectedCategory === cat
                  ? "bg-[#ff5e14] text-white border-[#ff5e14]"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 py-12 text-center">
            <h3 className="mb-2 text-lg font-semibold text-red-900">Failed to load toolkits</h3>
            <p className="text-red-700">Something went wrong. Please refresh and try again.</p>
          </div>
        ) : filteredToolkits.length === 0 ? (
          <div className="rounded-lg border bg-white py-12 text-center">
            <h3 className="mb-2 text-lg font-semibold text-gray-600">No toolkits found for {selectedCategory}</h3>
            <p className="text-gray-500">Check back soon for new content!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredToolkits.map((toolkit) => (
              <ToolkitCardNew key={toolkit.id} toolkit={toolkit} allToolkits={toolkits} href={`/toolkit/${toolkit.id}`} />
            ))}
            {filteredToolkits.length === 1 && <ToolkitComingSoonCard />}
          </div>
        )}

        <ToolkitStudentFeedback />
      </div>
    </div>
  );
}
