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
}

interface BannerSprint {
  id: string;
  title: string;
  coverImageUrl?: string | null;
  cardImageUrl?: string | null;
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
    const items: Array<{
      id: string;
      title: string;
      imageUrl: string | null;
      href: string;
      eventType: string;
      eventProps: Record<string, unknown>;
    }> = [];

    const maxLength = Math.max(cohorts.length, sprints.length);
    for (let i = 0; i < maxLength; i++) {
      if (i < cohorts.length) {
        const cohort = cohorts[i];
        items.push({
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
        });
      }
      if (i < sprints.length) {
        const sprint = sprints[i];
        items.push({
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
        });
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
            {bannerItems.map((item) => (
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
