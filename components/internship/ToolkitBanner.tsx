"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import posthog from "posthog-js";

import PageBannerCarousel from "@/components/banner/PageBannerCarousel";
import { Skeleton } from "@/components/ui/skeleton";
import { useCohorts } from "@/lib/queries-cohorts";
import { useSprints } from "@/lib/queries-sprints";

interface BannerCohort {
  id: string;
  title: string;
  coverImageUrl?: string | null;
  cardImageUrl?: string | null;
  startDate?: string | null;
  createdAt?: string | Date | null;
}

interface BannerSprint {
  id: string;
  title: string;
  coverImageUrl?: string | null;
  cardImageUrl?: string | null;
  startDate?: string | null;
  createdAt?: string | Date | null;
}

interface FormattedBannerItem {
  id: string;
  title: string;
  imageUrl: string | null;
  href: string;
  eventType: string;
  eventProps: Record<string, unknown>;
  type: "cohort" | "sprint";
}

function getProgramDateScore(
  startDate?: string | null,
  createdAt?: string | Date | null
): number {
  const now = new Date();
  let parsedDate: Date | null = null;
  let isUpcoming = false;

  if (startDate && typeof startDate === "string") {
    // 1. Direct date parsing
    const direct = new Date(startDate.trim());
    if (!isNaN(direct.getTime())) {
      parsedDate = direct;
      isUpcoming = direct.getTime() >= now.getTime();
    } else {
      // 2. Regex matching common textual dates like "20th Oct", "Starts 15th Nov", "Nov 15"
      const match = startDate.match(
        /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{1,2})|(\d{1,2})(?:st|nd|rd|th)?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/i
      );
      if (match) {
        const monthNames: Record<string, number> = {
          jan: 0,
          feb: 1,
          mar: 2,
          apr: 3,
          may: 4,
          jun: 5,
          jul: 6,
          aug: 7,
          sep: 8,
          oct: 9,
          nov: 10,
          dec: 11,
        };
        const monthStr = (match[1] || match[4]).toLowerCase().slice(0, 3);
        const day = parseInt(match[2] || match[3], 10);
        const month = monthNames[monthStr];

        const yearMatch = startDate.match(/\b(20\d{2})\b/);
        const year = yearMatch ? parseInt(yearMatch[1], 10) : now.getFullYear();
        parsedDate = new Date(year, month, day, 23, 59, 59);

        // If no year specified and date is over 60 days in the past, treat as next year
        if (
          !yearMatch &&
          parsedDate.getTime() < now.getTime() &&
          now.getTime() - parsedDate.getTime() > 60 * 24 * 60 * 60 * 1000
        ) {
          parsedDate.setFullYear(year + 1);
        }
        isUpcoming = parsedDate.getTime() >= now.getTime();
      }
    }
  }

  const createdTime = createdAt ? new Date(createdAt).getTime() : 0;

  // Sorting score:
  // Tier 1 (Upcoming starting soonest): score 1e11 + distance to future date (lowest score = highest rank)
  // Tier 2 (Active/no explicit start date): score 2e11 + age in ms
  // Tier 3 (Closed/past dates): score 3e11 + elapsed past time (pushed to end)
  if (parsedDate && isUpcoming) {
    return 1e11 + Math.max(0, parsedDate.getTime() - now.getTime());
  } else if (!parsedDate) {
    const age = now.getTime() - (createdTime || 0);
    return 2e11 + Math.max(0, age);
  } else {
    const elapsed = now.getTime() - parsedDate.getTime();
    return 3e11 + Math.max(0, elapsed);
  }
}

export default function ToolkitBanner() {
  const [mounted, setMounted] = useState(false);
  const { data: cohortsData = [], isLoading: cohortsLoading } = useCohorts();
  const { data: sprintsData = [], isLoading: sprintsLoading } = useSprints();

  useEffect(() => {
    setMounted(true);
  }, []);

  const bannerItems = useMemo(() => {
    const cohorts = (cohortsData || []) as BannerCohort[];
    const sprints = (sprintsData || []) as BannerSprint[];

    // Sort both queues by date priority (upcoming soonest -> active recent -> closed past)
    const sortedCohorts = [...cohorts].sort(
      (a, b) =>
        getProgramDateScore(a.startDate, a.createdAt) -
        getProgramDateScore(b.startDate, b.createdAt)
    );

    const sortedSprints = [...sprints].sort(
      (a, b) =>
        getProgramDateScore(a.startDate, a.createdAt) -
        getProgramDateScore(b.startDate, b.createdAt)
    );

    // Format helpers
    const formatCohort = (cohort: BannerCohort): FormattedBannerItem => ({
      id: cohort.id,
      title: cohort.title,
      imageUrl: cohort.coverImageUrl || cohort.cardImageUrl || null,
      href: `/toolkit/cohorts/${cohort.id}`,
      eventType: "internship_cohort_clicked",
      eventProps: {
        cohort_id: cohort.id,
        cohort_title: cohort.title,
        source: "internship_banner",
      },
      type: "cohort",
    });

    const formatSprint = (sprint: BannerSprint): FormattedBannerItem => ({
      id: sprint.id,
      title: sprint.title,
      imageUrl: sprint.cardImageUrl || sprint.coverImageUrl || null,
      href: `/toolkit/sprints/${sprint.id}`,
      eventType: "internship_sprint_clicked",
      eventProps: {
        sprint_id: sprint.id,
        sprint_title: sprint.title,
        source: "internship_banner",
      },
      type: "sprint",
    });

    // Determine which program category leads based on whichever starts first/is most recent
    const leadCohort = sortedCohorts[0];
    const leadSprint = sortedSprints[0];

    const sprintLeads =
      leadSprint &&
      (!leadCohort ||
        getProgramDateScore(leadSprint.startDate, leadSprint.createdAt) <
          getProgramDateScore(leadCohort.startDate, leadCohort.createdAt));

    const queue1 = sprintLeads
      ? sortedSprints.map(formatSprint)
      : sortedCohorts.map(formatCohort);
    const queue2 = sprintLeads
      ? sortedCohorts.map(formatCohort)
      : sortedSprints.map(formatSprint);

    // Interleave queues
    const items: FormattedBannerItem[] = [];
    const maxLength = Math.max(queue1.length, queue2.length);
    for (let i = 0; i < maxLength; i++) {
      if (i < queue1.length) {
        items.push(queue1[i]);
      }
      if (i < queue2.length) {
        items.push(queue2[i]);
      }
    }

    return items;
  }, [cohortsData, sprintsData]);

  if (!mounted || cohortsLoading || sprintsLoading) {
    return (
      <div>
        <Skeleton className="mb-1 h-[96px] w-full rounded-xl sm:h-[84px]" />
        <div className="-mx-4 mb-3 px-4 pt-3 pb-1 lg:-mx-2 lg:mb-0 lg:px-2">
          <div className="flex gap-3 overflow-hidden pb-2">
            {[...Array(3)].map((_, index) => (
              <Skeleton
                key={index}
                className="h-[85px] min-w-[130px] rounded-lg sm:h-[95px] sm:min-w-[140px]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-0">
        <PageBannerCarousel placement="internship" className="w-full" />
      </div>

      {/* Cohorts & Sprints Section - Sticky on all views, pointer-events pass-through */}
      {bannerItems.length > 0 && (
        <div className="pointer-events-none sticky top-16 z-30 -mx-4 mb-3 bg-gray-50 px-4 pt-3 pb-1 lg:-mx-2 lg:mb-0 lg:px-2">
          {/* Horizontal Scrolling List */}
          <div
            className="hide-scrollbar pointer-events-auto flex snap-x gap-3 overflow-x-auto pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {bannerItems.map((item, index) => (
              <Link
                href={item.href}
                key={`${item.eventType}-${item.id}`}
                onClick={() => {
                  posthog.capture(item.eventType, item.eventProps);
                }}
                className="group relative h-[85px] min-w-[130px] shrink-0 snap-start overflow-hidden rounded-lg sm:h-[95px] sm:min-w-[140px]"
              >
                {/* Background Image */}
                {item.imageUrl ? (
                  <div className="absolute inset-0 overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={`${item.title} cover`}
                      fill
                      sizes="(max-width: 640px) 130px, 140px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-slate-200" />
                )}

                {/* Gradient Overlay for text readability */}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent" />

                {/* Recommended Black Tag on the First Item */}
                {index === 0 && (
                  <span className="absolute top-2 left-2 z-20 rounded-md border border-white/20 bg-black/90 px-2 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase shadow-md backdrop-blur-md sm:text-[10px]">
                    Recommended
                  </span>
                )}

                {/* Content */}
                <div className="absolute right-0 bottom-0 left-0 flex items-end justify-between p-2 text-white sm:p-2.5">
                  <div className="flex flex-col">
                    <span className="mb-0.5 line-clamp-2 text-[11px] leading-tight font-semibold sm:text-xs">
                      {item.title}
                    </span>
                  </div>
                  <ArrowRight className="ml-1 h-3 w-3 shrink-0 text-white sm:h-3.5 sm:w-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
