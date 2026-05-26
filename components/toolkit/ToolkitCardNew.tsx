"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Toolkit } from "@/types/interfaces";
import { Check, Flame } from "lucide-react";

interface ToolkitCardNewProps {
  toolkit: Toolkit;
  href: string;
  className?: string;
}

export default function ToolkitCardNew({
  toolkit,
  href,
  className,
}: ToolkitCardNewProps) {
  const hasOriginalPrice =
    toolkit.originalPrice && toolkit.originalPrice > toolkit.price;

  return (
    <Link href={href} className="block" prefetch>
      <Card
        className={cn(
          "relative group flex cursor-pointer flex-row gap-0 overflow-hidden border bg-white py-0 transition-shadow hover:shadow-md sm:flex-col",
          className
        )}
      >
        {toolkit.is_trending && (
          <div className="absolute -top-0.5 right-0 z-20">
            <Badge className="bg-orange-500 text-white rounded-tl-none rounded-br-none px-1 py-0.5 text-[10px] font-medium">
              <Flame className="h-2.5 w-2.5 mr-0.5 inline" />Trending
            </Badge>
          </div>
        )}
        <div className="relative min-h-28 w-28 shrink-0 self-stretch overflow-hidden bg-gray-100 sm:aspect-video sm:h-auto sm:w-full">
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

          {toolkit.category && (
            <Badge
              variant="secondary"
              className="absolute top-2 left-2 text-[10px] sm:top-3 sm:left-3 sm:text-xs"
            >
              {toolkit.category}
            </Badge>
          )}

          {hasOriginalPrice && toolkit.showSaleBadge && (
            <Badge className="absolute top-3 right-3 hidden bg-rose-500 text-xs text-white hover:bg-rose-600 sm:inline-flex">
              Sale
            </Badge>
          )}
        </div>

        <CardContent className="flex flex-1 flex-col justify-between p-3 sm:block">
          <p className="mb-1 text-[11px] text-gray-500 sm:text-xs">
            {toolkit.creatorName && (
              <span className="font-medium text-gray-700">
                {toolkit.creatorName}
              </span>
            )}
            {toolkit.creatorName && toolkit.lessonCount && (
              <span className="mx-1">•</span>
            )}
            {toolkit.lessonCount && <span>{toolkit.lessonCount} lessons</span>}
            {toolkit.totalDuration && (
              <>
                <span className="mx-1">•</span>
                <span>{toolkit.totalDuration}</span>
              </>
            )}
          </p>

          <h3 className="mb-1 line-clamp-1 text-sm font-semibold text-gray-900 transition-colors group-hover:text-gray-700 sm:text-base">
            {toolkit.title.charAt(0).toUpperCase() + toolkit.title.slice(1)}
          </h3>

          {/* replace description with highlights list (up to 4) */}
          {toolkit.highlights && toolkit.highlights.length > 0 ? (
            <ul className="mb-2 space-y-1">
              {toolkit.highlights.slice(0, 4).map((highlight, index) => (
                <li key={index} className="flex items-start gap-2 text-[12px] text-gray-700">
                  <Check className="mt-1 h-5 w-5 text-orange-500" aria-hidden />
                  <span className="leading-tight">{highlight}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-gray-900 sm:text-lg">
                ₹{toolkit.price.toLocaleString("en-IN")}
              </span>
              {hasOriginalPrice && (
                <span className="text-xs text-gray-400 line-through">
                  ₹{toolkit.originalPrice!.toLocaleString("en-IN")}
                </span>
              )}
              {hasOriginalPrice && toolkit.showSaleBadge && (
                <Badge
                  variant="outline"
                  className="border-rose-200 bg-rose-50 text-[10px] text-rose-700 sm:hidden"
                >
                  Sale
                </Badge>
              )}
            </div>

            <div className="group-hover:text-primary flex items-center gap-1 text-xs font-medium text-gray-600 transition-colors group-hover:translate-x-1 sm:text-sm">
              View Details
              <svg
                className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
