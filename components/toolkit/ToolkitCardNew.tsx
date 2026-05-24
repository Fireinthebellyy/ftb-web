"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Toolkit } from "@/types/interfaces";
import { Flame, ArrowRight, Star, Clock } from "lucide-react";

interface ToolkitCardNewProps {
  toolkit: Toolkit;
  href: string;
  className?: string;
  allToolkits?: Toolkit[];
}

export default function ToolkitCardNew({
  toolkit,
  href,
  className,
  allToolkits,
}: ToolkitCardNewProps) {
  const hasOriginalPrice =
    toolkit.originalPrice && toolkit.originalPrice > toolkit.price;

  const bundleToolkits = toolkit.isBundle && toolkit.bundleItems && allToolkits
    ? toolkit.bundleItems.map(id => allToolkits.find(t => t.id === id)).filter(Boolean) as Toolkit[]
    : [];

  const getProcessedHighlights = () => {
    if (!toolkit.highlights || toolkit.highlights.length === 0) return [];

    const results: string[] = [];
    let currentTotalWords = 0;

    for (const h of toolkit.highlights) {
      if (currentTotalWords >= 50) break;

      const words = h.trim().split(/\s+/);
      const isOver12 = words.length > 12;

      let bulletWords = isOver12 ? words.slice(0, 12) : words;

      if (currentTotalWords + bulletWords.length > 50) {
        const remaining = 50 - currentTotalWords;
        bulletWords = bulletWords.slice(0, remaining);
      }

      const finalString = bulletWords.join(" ");
      results.push(finalString);
      currentTotalWords += bulletWords.length;
    }

    return results;
  };

  const displayHighlights = getProcessedHighlights();

  return (
    <Link href={href} className="block h-full" prefetch>
      <Card
        className={cn(
          "relative group flex cursor-pointer flex-col overflow-hidden border bg-white py-0 transition-shadow hover:shadow-md h-full rounded-2xl",
          className
        )}
      >
        {toolkit.isBundle ? (
          <div className="flex-1 flex flex-col p-4 bg-white relative">
            {/* Badges — top right */}
            <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
              {toolkit.is_trending && (
                <span className="flex w-fit items-center rounded-full bg-[#ff5e14] px-2 py-0.5 text-[10px] font-medium text-white shadow-sm sm:text-xs">
                  <Flame className="mr-0.5 h-3 w-3" /> Trending
                </span>
              )}
              {toolkit.isBestSeller && (
                <span className="flex w-fit items-center rounded-full bg-[#ffb000] px-2.5 py-1 text-[10px] font-semibold text-yellow-950 shadow-sm sm:text-[11px]">
                  <Star className="mr-1 h-3 w-3 fill-yellow-950" /> Best Seller
                </span>
              )}
              {toolkit.isLimitedSeats && (
                <span className="flex w-fit items-center rounded-full bg-[#00aaff] px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm sm:text-[11px]">
                  <Clock className="mr-1 h-3 w-3" /> Limited Seats
                </span>
              )}
            </div>

            {/* BUNDLE label — top left */}
            <div className="absolute top-3 left-3 z-10">
              <span className="w-fit rounded-full bg-purple-100 px-2.5 py-1 text-[10px] font-bold text-purple-700 shadow-sm sm:text-xs">
                BUNDLE
              </span>
            </div>

            <div className="mb-4 mt-8">
              <p className="text-[13px] text-gray-500 mb-1">
                {toolkit.creatorName || "Fireinthebelly"}
              </p>
              <h3 className="text-[20px] font-bold text-gray-900 leading-tight">
                {toolkit.title.charAt(0).toUpperCase() + toolkit.title.slice(1)}
              </h3>
            </div>

            <div className="flex-1 flex flex-col gap-0 divide-y mb-4">
              {bundleToolkits.map((bToolkit, i) => (
                <div key={i} className="py-3.5 flex items-start justify-between">
                  <div className="flex flex-col pr-3">
                    <span className="text-[14px] text-gray-700 leading-tight mb-1">{bToolkit.title}</span>
                    <span className="text-[12px] text-gray-400 font-medium">{bToolkit.category || '1:1 Mentorship'}</span>
                  </div>
                  <span className="bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 text-[11px] font-semibold shrink-0 mt-0.5">x1</span>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-4 flex flex-col border-t border-transparent">
              <div className="text-[10px] font-semibold tracking-wider text-gray-400 mb-1">PRICE</div>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-gray-900 sm:text-[22px]">
                    ₹{toolkit.price.toLocaleString("en-IN")}
                  </span>
                  {hasOriginalPrice && (
                    <span className="text-[13px] font-medium text-gray-400 line-through">
                      ₹{toolkit.originalPrice!.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>

                <div className="group-hover:text-[#ff5e14] flex items-center gap-1 text-sm font-medium text-[#ff5e14] transition-colors">
                  View Details
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="relative aspect-[4/3] w-full shrink-0 self-stretch overflow-hidden bg-gray-100">
              {toolkit.coverImageUrl ? (
                <Image
                  src={toolkit.coverImageUrl}
                  alt={toolkit.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 112px, (max-width: 1024px) 50vw, 25vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gray-100">
                  <span className="text-4xl font-bold text-gray-300">
                    {toolkit.title.charAt(0)}
                  </span>
                </div>
              )}

              <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                {toolkit.category && (
                  <span className="w-fit rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-gray-600 shadow-sm sm:text-xs">
                    {toolkit.category}
                  </span>
                )}
                {toolkit.isBundle && (
                  <span className="w-fit rounded-full bg-purple-100 px-2.5 py-1 text-[10px] font-bold text-purple-700 shadow-sm sm:text-xs">
                    BUNDLE
                  </span>
                )}
              </div>

              <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
                {toolkit.is_trending && (
                  <span className="flex w-fit items-center rounded-full bg-[#ff5e14] px-2 py-0.5 text-[10px] font-medium text-white shadow-sm sm:text-xs">
                    <Flame className="mr-0.5 h-3 w-3" /> Trending
                  </span>
                )}
                {toolkit.isBestSeller && (
                  <span className="flex w-fit items-center rounded-full bg-[#ffb000] px-2.5 py-1 text-[10px] font-semibold text-yellow-950 shadow-sm sm:text-[11px]">
                    <Star className="mr-1 h-3 w-3 fill-yellow-950" /> Best Seller
                  </span>
                )}
                {toolkit.isLimitedSeats && (
                  <span className="flex w-fit items-center rounded-full bg-[#00aaff] px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm sm:text-[11px]">
                    <Clock className="mr-1 h-3 w-3" /> Limited Seats
                  </span>
                )}
                {hasOriginalPrice && toolkit.showSaleBadge && (
                  <Badge className="w-fit hidden bg-rose-500 text-[10px] text-white hover:bg-rose-600 sm:inline-flex shadow-sm rounded-full px-2 py-0.5 border-none font-bold">
                    Sale
                  </Badge>
                )}
              </div>

              {(toolkit.lessonCount || toolkit.totalDuration) && (
                <div className="absolute bottom-2 right-2 z-10 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-medium text-white sm:text-xs">
                  {toolkit.lessonCount ? `${toolkit.lessonCount} lessons` : ""}
                  {toolkit.lessonCount && toolkit.totalDuration ? " • " : ""}
                  {toolkit.totalDuration ? toolkit.totalDuration : ""}
                </div>
              )}
            </div>

            <CardContent className="flex flex-1 flex-col p-4">
              <p className="mb-1 text-xs text-gray-500 sm:text-[13px]">
                {toolkit.creatorName ? (
                  <span className="text-gray-500">{toolkit.creatorName}</span>
                ) : (
                  <span className="text-gray-500">Fireinthebelly</span>
                )}
              </p>

              <h3 className="mb-1 line-clamp-1 text-[15px] font-semibold text-gray-900 transition-colors group-hover:text-gray-700 sm:text-base">
                {toolkit.title.charAt(0).toUpperCase() + toolkit.title.slice(1)}
              </h3>

              {displayHighlights.length > 0 ? (
                <ul className="mb-5 mt-3 space-y-3 flex-1">
                  {displayHighlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-[13px] text-gray-600 sm:text-[14px]">
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff5e14]" />
                      <span className="leading-relaxed tracking-wide">{highlight}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex-1" />
              )}

              <div className="mt-auto pt-4 flex flex-col border-t border-transparent">
                <div className="text-[10px] font-semibold tracking-wider text-gray-400 mb-1">PRICE</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-gray-900 sm:text-xl">
                      ₹{toolkit.price.toLocaleString("en-IN")}
                    </span>
                    {hasOriginalPrice && (
                      <span className="text-xs font-medium text-gray-400 line-through">
                        ₹{toolkit.originalPrice!.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>

                  <div className="group-hover:text-[#ff5e14] flex items-center gap-1 text-xs font-medium text-[#ff5e14] transition-colors sm:text-sm">
                    View Details
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </Link>
  );
}
