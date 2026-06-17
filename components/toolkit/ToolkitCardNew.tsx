"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, stripHtml } from "@/lib/utils";
import { Toolkit } from "@/types/interfaces";
import { Flame, ArrowRight, Star, Clock, Check } from "lucide-react";

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
  const isDigitalProduct = toolkit.category === "digital products";

  return (
    <Link href={href} className="block h-full" prefetch>
      <Card
        className={cn(
          "relative group flex cursor-pointer overflow-hidden border bg-white py-0 transition-shadow hover:shadow-md h-full rounded-2xl",
          !isDigitalProduct && !toolkit.isBundle ? "flex-row sm:flex-col" : "flex-col",
          className
        )}
      >
        {isDigitalProduct ? (
          <CardContent className="flex h-full flex-col p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-orange-200 bg-orange-50 text-orange-700"
                  >
                    Digital Product
                  </Badge>
                  {toolkit.digitalProductSectionTitle ? (
                    <Badge variant="secondary">
                      {toolkit.digitalProductSectionTitle}
                    </Badge>
                  ) : null}
                </div>

                <h3 className="text-xl font-semibold leading-tight text-gray-950 transition-colors group-hover:text-gray-700">
                  {toolkit.title.charAt(0).toUpperCase() + toolkit.title.slice(1)}
                </h3>
              </div>

              <div className="flex flex-col items-end gap-2">
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
            </div>

            {toolkit.description ? (
              <p className="mb-4 line-clamp-3 text-sm leading-6 text-gray-600">
                {stripHtml(toolkit.description)}
              </p>
            ) : null}

            {displayHighlights.length > 0 ? (
              <ul className="mb-5 grid gap-2 sm:grid-cols-2">
                {displayHighlights.map((highlight, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-[13px] text-gray-600"
                  >
                    <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff5e14]" />
                    <span className="leading-relaxed">{highlight}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex-1" />
            )}

            <div className="mt-auto flex items-end justify-between border-t border-gray-100 pt-4">
              <div>
                <div className="mb-1 text-[10px] font-semibold tracking-wider text-gray-400">
                  PRICE
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-gray-900">
                    ₹{toolkit.price.toLocaleString("en-IN")}
                  </span>
                  {hasOriginalPrice && (
                    <span className="text-xs font-medium text-gray-400 line-through">
                      ₹{toolkit.originalPrice!.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>

              <div className="group-hover:text-[#ff5e14] flex items-center gap-1 text-sm font-medium text-[#ff5e14] transition-colors">
                View Details
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </CardContent>
        ) : toolkit.isBundle ? (
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
            <div className="relative w-[140px] shrink-0 sm:w-full sm:aspect-[4/3] overflow-hidden bg-gray-100 border-r sm:border-r-0 border-gray-50">
              {toolkit.coverImageUrl ? (
                <Image
                  src={toolkit.coverImageUrl}
                  alt={toolkit.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 140px, (max-width: 1024px) 50vw, 25vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gray-100">
                  <span className="text-4xl font-bold text-gray-300">
                    {toolkit.title.charAt(0)}
                  </span>
                </div>
              )}

              <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 sm:top-3 sm:left-3 sm:gap-2">
                {toolkit.category && (
                  <span className="w-fit rounded-full bg-white/95 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-gray-700 shadow-sm sm:px-2.5 sm:py-1 sm:text-xs">
                    {toolkit.category}
                  </span>
                )}
                {toolkit.isBundle && (
                  <span className="w-fit rounded-full bg-purple-100/95 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-purple-700 shadow-sm sm:px-2.5 sm:py-1 sm:text-xs">
                    BUNDLE
                  </span>
                )}
              </div>

              {(toolkit.subtitle || toolkit.lessonCount || toolkit.totalDuration) && (
                <div className="hidden sm:block absolute bottom-2 right-2 z-10 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-medium text-white sm:text-xs">
                  {toolkit.subtitle ? (
                    toolkit.subtitle
                  ) : (
                    <>
                      {toolkit.lessonCount ? `${toolkit.lessonCount} lessons` : ""}
                      {toolkit.lessonCount && toolkit.totalDuration ? " • " : ""}
                      {toolkit.totalDuration ? toolkit.totalDuration : ""}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Top Right Badges (Floating on the card corner) */}
            <div className="absolute top-0 right-0 z-20 flex flex-col items-end">
              {toolkit.is_trending && (
                <span className="flex w-fit items-center rounded-bl-lg bg-[#ff5e14] px-2 py-1 text-[10px] font-medium text-white shadow-sm sm:px-2.5 sm:text-xs">
                  <Flame className="mr-0.5 h-3 w-3" /> Trending
                </span>
              )}
              {toolkit.isBestSeller && !toolkit.is_trending && (
                <span className="flex w-fit items-center rounded-bl-lg bg-[#ffb000] px-2.5 py-1 text-[10px] font-semibold text-yellow-950 shadow-sm sm:text-[11px]">
                  <Star className="mr-1 h-3 w-3 fill-yellow-950" /> Best Seller
                </span>
              )}
              {toolkit.isLimitedSeats && !toolkit.is_trending && !toolkit.isBestSeller && (
                <span className="flex w-fit items-center rounded-bl-lg bg-[#00aaff] px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm sm:text-[11px]">
                  <Clock className="mr-1 h-3 w-3" /> Limited Seats
                </span>
              )}
              {hasOriginalPrice && toolkit.showSaleBadge && (
                <Badge className="w-fit hidden bg-rose-500 text-[10px] text-white hover:bg-rose-600 sm:inline-flex shadow-sm rounded-bl-lg px-2 py-0.5 border-none font-bold">
                  Sale
                </Badge>
              )}
            </div>

            <CardContent className="flex flex-1 flex-col px-3 py-3 sm:px-4 sm:pb-4 sm:pt-4 min-w-0">
              <div className="mb-1 text-[10px] text-gray-500 sm:hidden flex items-center gap-1 flex-wrap pr-16 leading-none">
                 <span>{toolkit.creatorName || "Fireinthebelly"}</span>
                 {(toolkit.lessonCount || toolkit.totalDuration) && <span>•</span>}
                 {toolkit.lessonCount && <span>{toolkit.lessonCount} lessons</span>}
                 {toolkit.lessonCount && toolkit.totalDuration && <span>•</span>}
                 {toolkit.totalDuration && <span>{toolkit.totalDuration}</span>}
              </div>

              <div className="mb-2 sm:mb-1 flex items-start justify-between gap-2 pr-16 sm:pr-0">
                <h3 className="text-[14px] sm:text-[15px] line-clamp-2 sm:line-clamp-1 font-bold text-gray-900 transition-colors group-hover:text-gray-700 leading-snug">
                  {toolkit.title.charAt(0).toUpperCase() + toolkit.title.slice(1)}
                </h3>
                {toolkit.rating && (
                  <div className="hidden sm:flex shrink-0 items-center gap-1 rounded-md bg-yellow-50 px-1.5 py-0.5 text-xs font-semibold text-yellow-700 border border-yellow-200/50">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    {toolkit.rating}
                  </div>
                )}
              </div>

              {displayHighlights.length > 0 ? (
                <ul className="mb-3 sm:mb-5 sm:mt-2 space-y-1.5 sm:space-y-1.5 flex-1">
                  {displayHighlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-1.5 sm:gap-2.5 text-[11px] sm:text-[13px] text-gray-600">
                      <Check className="mt-[2px] sm:mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff5e14]" strokeWidth={3} />
                      <span className="leading-tight sm:leading-relaxed tracking-wide line-clamp-2 sm:line-clamp-none">{highlight}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex-1" />
              )}

              <div className="mt-auto pt-2 sm:pt-4 flex flex-col sm:border-t border-transparent sm:border-gray-100">
                <div className="hidden sm:block text-[10px] font-semibold tracking-wider text-gray-400 mb-1">PRICE</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm sm:text-lg font-bold text-gray-900">
                      ₹{toolkit.price.toLocaleString("en-IN")}
                    </span>
                    {hasOriginalPrice && (
                      <span className="text-[10px] sm:text-xs font-medium text-gray-400 line-through">
                        ₹{toolkit.originalPrice!.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>

                  <div className="group-hover:text-[#ff5e14] flex items-center gap-0.5 sm:gap-1 text-[11px] sm:text-sm font-medium text-gray-500 sm:text-[#ff5e14] transition-colors">
                    View Details
                    <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform group-hover:translate-x-1" />
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
