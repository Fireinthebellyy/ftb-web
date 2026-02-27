"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import PageBannerCarousel from "@/components/banner/PageBannerCarousel";
import { useToolkits } from "@/lib/queries/toolkits";

export default function ToolkitBanner() {
  const [mounted, setMounted] = useState(false);
  const { data: toolkits = [], isLoading: toolkitsLoading } = useToolkits();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || toolkitsLoading) {
    return (
      <div className="mb-1 h-[96px] w-full animate-pulse rounded-lg bg-slate-100 sm:h-[84px]" />
    );
  }

  return (
    <div className="mb-1 flex w-full flex-col space-y-2">
      <PageBannerCarousel placement="internship" className="w-full" />

      {/* Premium Toolkits Section */}
      {toolkits.length > 0 && (
        <div className="pt-1">
          {/* Horizontal Scrolling List */}
          <div
            className="hide-scrollbar flex snap-x gap-3 overflow-x-auto pb-3"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {toolkits.map((toolkit) => (
              <Link
                href={`/toolkit/${toolkit.id}`}
                key={toolkit.id}
                className="group relative h-[85px] min-w-[130px] shrink-0 snap-start overflow-hidden rounded-lg sm:h-[95px] sm:min-w-[140px]"
              >
                {/* Background Image */}
                {toolkit.coverImageUrl ? (
                  <div className="absolute inset-0 overflow-hidden">
                    <Image
                      src={toolkit.coverImageUrl}
                      alt={`${toolkit.title} cover`}
                      fill
                      sizes="(max-width: 640px) 130px, 140px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : null}
                {!toolkit.coverImageUrl && (
                  <div className="absolute inset-0 bg-slate-200" />
                )}

                {/* Gradient Overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                {/* Content */}
                <div className="absolute right-0 bottom-0 left-0 flex items-end justify-between p-2 text-white sm:p-2.5">
                  <div className="flex flex-col">
                    <span className="mb-0.5 line-clamp-2 text-[11px] leading-tight font-semibold sm:text-xs">
                      {toolkit.title}
                    </span>
                    <span className="text-[9px] text-gray-200 sm:text-[10px]">
                      ₹{toolkit.price.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <ArrowRight className="ml-1 h-3 w-3 shrink-0 text-white sm:h-3.5 sm:w-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
