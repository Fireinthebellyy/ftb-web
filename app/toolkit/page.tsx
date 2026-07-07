"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import ToolkitCardNew from "@/components/toolkit/ToolkitCardNew";
import { MentorshipCarousel } from "@/components/toolkit/MentorshipCarousel";
import ToolkitComingSoonCard from "@/components/toolkit/ToolkitComingSoonCard";
import ToolkitStudentFeedback from "@/components/toolkit/ToolkitStudentFeedback";
import { StackedTestimonials } from "@/components/toolkit/StackedTestimonials";
import { Toolkit } from "@/types/interfaces";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export default function ToolkitPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("Recorded toolkits");

  const TAB_CATEGORIES = [
    { label: "Recorded Lectures", value: "Recorded toolkits" },
    { label: "1:1 Mentorship", value: "1:1 Mentorship" },
    { label: "Digital products", value: "digital products" },
    { label: "Cohort", value: "Cohort" }
  ];

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

  const filteredToolkits = toolkits.filter((t) => t.category === selectedCategory);
  
  const isViewingDigitalProducts = selectedCategory === "digital products";
  const first1on1Mentorship = toolkits.find((t) => t.category === "1:1 Mentorship");
  const mentorId = first1on1Mentorship?.mentorshipDetails?.mentorId;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-[20px]">
          <h1 className="text-3xl font-bold text-gray-900">Toolkit & Guide</h1>
        </div>

        <MentorshipCarousel mentorId={mentorId} />

        <div className="mb-[15px] flex overflow-x-auto gap-3 pb-2 sm:flex-wrap sm:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {TAB_CATEGORIES.map(({ label, value }) => {
            const isActive = selectedCategory === value;
            return (
              <button
                key={value}
                onClick={() => setSelectedCategory(value)}
                className={cn(
                  "flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors border shadow-sm",
                  isActive
                    ? "bg-[#ff5e14] text-white border-[#ff5e14]"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                )}
              >
                {isActive && <Check className="h-4 w-4" />}
                {label}
              </button>
            );
          })}
        </div>

        {isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 py-12 text-center">
            <h3 className="mb-2 text-lg font-semibold text-red-900">Failed to load toolkits</h3>
            <p className="text-red-700">Something went wrong. Please refresh and try again.</p>
          </div>
        ) : filteredToolkits.length === 0 ? (
          <div className="rounded-lg border bg-white py-12 text-center">
            <h3 className="mb-2 text-lg font-semibold text-gray-600">
              No toolkits found for {TAB_CATEGORIES.find(c => c.value === selectedCategory)?.label || selectedCategory}
            </h3>
            <p className="text-gray-500">Check back soon for new content!</p>
          </div>
        ) : (
            <div
              className={cn(
                "grid grid-cols-1 gap-6",
                isViewingDigitalProducts
                  ? "lg:grid-cols-2"
                  : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              )}
            >
              {filteredToolkits.map((toolkit) => (
                <ToolkitCardNew key={toolkit.id} toolkit={toolkit} allToolkits={toolkits} href={`/toolkit/${toolkit.id}`} />
              ))}
              {filteredToolkits.length === 1 && <ToolkitComingSoonCard />}
            </div>
        )}

        <div className="mt-16">
          <div className="text-center space-y-2 mb-[25px]">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">What students feel about us</h2>
            <p className="text-gray-500">Real experiences from students who leveled up their careers with us.</p>
          </div>
          
          <StackedTestimonials />
          
          <div className="max-w-2xl mx-auto mt-8">
            <ToolkitStudentFeedback />
          </div>
        </div>
      </div>
    </div>
  );
}
