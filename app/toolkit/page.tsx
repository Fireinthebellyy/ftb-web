"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import ToolkitCardNew from "@/components/toolkit/ToolkitCardNew";
import ToolkitComingSoonCard from "@/components/toolkit/ToolkitComingSoonCard";
import { Toolkit } from "@/types/interfaces";
import { Skeleton } from "@/components/ui/skeleton";

const toolkitTestimonials = [
  "These toolkits cut through the noise. I stopped overthinking and started taking action with a clear plan.",
  "I finally understood what to do week by week for internships. Super practical and easy to follow.",
  "The lessons feel like senior guidance, not generic advice. Helped me move faster with confidence.",
  "Whenever I feel stuck, I open a toolkit and leave with a clear next step.",
];

export default function ToolkitPage() {
  const [activeTestimonialIndex, setActiveTestimonialIndex] =
    React.useState<number>(0);

  React.useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveTestimonialIndex((prev) =>
        prev === toolkitTestimonials.length - 1 ? 0 : prev + 1
      );
    }, 3500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Toolkits</h1>
          <p className="mt-1 text-gray-600">
            Expert-crafted resources to help you level up your career
          </p>
        </div>

        {toolkits.length === 0 ? (
          <div className="rounded-lg border bg-white py-12 text-center">
            <h3 className="mb-2 text-lg font-semibold text-gray-600">
              No toolkits found
            </h3>
            <p className="text-gray-500">Check back soon for new content!</p>
          </div>
        ) : (
          <div className="space-y-4">
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

            <div className="rounded-lg border border-orange-100 bg-white px-4 py-4 sm:px-5">
              <p className="text-xs font-semibold tracking-wide text-orange-700 uppercase">
                Student feedback
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-700 sm:text-base">
                &ldquo;{toolkitTestimonials[activeTestimonialIndex]}&rdquo;
              </p>
              <div className="mt-3 flex items-center gap-1.5">
                {toolkitTestimonials.map((_, index) => (
                  <span
                    key={index}
                    className={`h-1.5 rounded-full transition-all ${
                      index === activeTestimonialIndex
                        ? "w-4 bg-orange-500"
                        : "w-1.5 bg-orange-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
