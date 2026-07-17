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
import { Check, Share2 } from "lucide-react";
import Link from "next/link";

interface CohortCard {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  badge1?: string | null;
  badge2?: string | null;
  cardImageUrl?: string | null;
  coverImageUrl?: string | null;
  startDate?: string | null;
  basePrice?: number | null;
  originalPrice?: number | null;
  highlights?: string[] | null;
  isBestSeller?: boolean | null;
  isFillingFast?: boolean | null;
}

export default function ToolkitPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("cohorts");

  const TAB_CATEGORIES = [
    { label: "Live Cohorts", value: "cohorts" },
    // { label: "Recorded Lectures", value: "Recorded toolkits" },
    { label: "1:1 Mentorship", value: "1:1 Mentorship" },
    { label: "Digital products", value: "digital products" }
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

  const { data: cohortsData = [], isLoading: cohortsLoading } = useQuery<CohortCard[]>({
    queryKey: ["cohorts"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/cohorts");
        return response.data;
      } catch (error) {
        console.error("Error fetching cohorts:", error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 10,
    enabled: !!session?.user,
  });

  if (sessionPending || !session || isLoading || cohortsLoading) {
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
        ) : selectedCategory === "cohorts" ? (
          cohortsData.length === 0 ? (
            <div className="rounded-lg border bg-white py-12 text-center">
              <h3 className="mb-2 text-lg font-semibold text-gray-600">No live cohorts found</h3>
              <p className="text-gray-500">Check back soon for new live cohort programs!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cohortsData.map((cohort) => (
                <div
                  key={cohort.id}
                  onClick={() => router.push(`/toolkit/cohorts/${cohort.id}`)}
                  className="cursor-pointer overflow-hidden rounded-xl border bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition duration-200"
                >
                  <div className="relative">
                    {cohort.cardImageUrl || cohort.coverImageUrl ? (
                      <img
                        src={cohort.cardImageUrl || cohort.coverImageUrl}
                        alt={cohort.title}
                        className="w-full aspect-[16/10] object-cover border-b"
                      />
                    ) : (
                      <div className="w-full aspect-[16/10] bg-orange-50 flex items-center justify-center border-b">
                        <span className="text-[#ff5e14] font-bold text-lg">Live Cohort</span>
                      </div>
                    )}
                    
                    <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-10">
                      {cohort.isFillingFast && (
                        <div className="bg-red-600 text-white text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                          Filling Fast
                        </div>
                      )}
                      {cohort.isBestSeller && (
                        <div className="bg-black text-white text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                          Best Seller
                        </div>
                      )}
                    </div>
                  </div>
                    <div className="p-4 space-y-3">
                      <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">
                        {cohort.title}
                      </h3>

                      {cohort.startDate && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 w-fit px-2.5 py-1 rounded-lg border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          {cohort.startDate}
                        </div>
                      )}

                      <div className="flex gap-2 items-center pt-1.5">
                        <a
                          href={`https://wa.me/916377492042?text=Hi!%20I'd%20like%20to%20enquire%20about%20the%20cohort%20program:%20${encodeURIComponent(cohort.title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-lg transition duration-200 shadow-sm flex items-center justify-center gap-1"
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.202-1.362a9.923 9.923 0 0 0 4.808 1.236h.005c5.505 0 9.99-4.477 9.99-9.985C22.005 6.478 17.518 2 12.012 2Zm5.845 14.285c-.244.686-1.42 1.328-1.948 1.41-.478.077-1.101.144-3.187-.723-2.667-1.108-4.37-3.816-4.502-3.992-.133-.176-1.077-1.43-1.077-2.729 0-1.298.679-1.937.922-2.202.244-.265.533-.332.71-.332.178 0 .356.006.51.013.162.008.38-.06.593.453.22.532.753 1.836.82 1.968.067.133.11.288.022.465-.088.177-.133.288-.266.443-.133.155-.28.347-.4.493-.133.16-.272.336-.117.6.155.265.686 1.132 1.47 1.831.99.885 1.823 1.157 2.08 1.288.254.133.403.11.553-.066.15-.177.643-.753.815-.996.172-.244.344-.2.58-.112.235.088 1.492.703 1.748.83.256.128.427.194.49.305.061.11.061.643-.183 1.329Z" />
                          </svg>
                          Enquire Now
                        </a>
                        <Link
                          href={`/toolkit/cohorts/${cohort.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 h-8 bg-black hover:bg-neutral-900 text-white text-[11px] font-semibold rounded-lg transition duration-200 border-2 border-[#ff5e14] shadow-[0_0_8px_rgba(255,94,20,0.35)] hover:shadow-[0_0_12px_rgba(255,94,20,0.55)] flex items-center justify-center"
                        >
                          Explore
                        </Link>
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const url = `${window.location.origin}/toolkit/cohorts/${cohort.id}`;
                            try {
                              await navigator.clipboard.writeText(url);
                              toast.success("Cohort link copied to clipboard!");
                            } catch {
                              toast.error("Failed to copy link. Please copy the URL manually.");
                            }
                          }}
                          className="h-8 w-8 border border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded-lg transition duration-200 shadow-sm shrink-0 flex items-center justify-center"
                          title="Share Cohort"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>

                      {cohort.highlights && cohort.highlights.length > 0 && (
                        <ul className="space-y-1.5 mt-3 pt-3 border-t border-gray-100">
                          {cohort.highlights.map((highlight, index) => (
                            <li key={index} className="flex items-start gap-1.5 text-xs text-gray-600">
                              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff5e14]" strokeWidth={3} />
                              <span className="leading-relaxed text-justify">{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                </div>
              ))}
            </div>
          )
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
