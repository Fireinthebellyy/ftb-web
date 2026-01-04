"use client";

import React from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Toolkit } from "@/types/interfaces";

interface ToolkitCardNewProps {
  toolkit: Toolkit;
  onClick?: () => void;
  className?: string;
}

export default function ToolkitCardNew({
  toolkit,
  onClick,
  className,
}: ToolkitCardNewProps) {
  const hasVideo = !!toolkit.videoUrl;
  const hasOriginalPrice =
    toolkit.originalPrice && toolkit.originalPrice > toolkit.price;

  return (
    <Card
      className={cn(
        "group relative cursor-pointer overflow-hidden py-0 transition-all duration-300 hover:shadow-xl hover:shadow-orange-100/50",
        className
      )}
      onClick={onClick}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        {toolkit.coverImageUrl ? (
          <Image
            src={toolkit.coverImageUrl}
            alt={toolkit.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100">
            <span className="text-4xl font-bold text-orange-300">
              {toolkit.title.charAt(0)}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {toolkit.category && (
          <Badge className="absolute top-3 left-3 bg-white/90 text-gray-900 hover:bg-white">
            {toolkit.category}
          </Badge>
        )}

        {hasVideo && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-gray-700">
            <Play className="h-3 w-3 fill-orange-500 text-orange-500" />
            Preview
          </div>
        )}

        <div className="absolute top-3 right-3">
          {hasOriginalPrice && (
            <Badge className="bg-orange-500 text-white hover:bg-orange-600">
              Sale
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
          {toolkit.creatorName && (
            <span className="font-medium text-orange-600">
              by {toolkit.creatorName}
            </span>
          )}
          {(toolkit.lessonCount || toolkit.totalDuration) && (
            <>
              <span>•</span>
              <span>
                {toolkit.lessonCount} lessons
                {toolkit.totalDuration && ` • ${toolkit.totalDuration}`}
              </span>
            </>
          )}
        </div>

        <h3 className="mb-2 line-clamp-1 text-lg font-semibold text-gray-900 transition-colors group-hover:text-orange-600">
          {toolkit.title}
        </h3>

        <p className="mb-4 line-clamp-2 text-sm text-gray-600">
          {toolkit.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-gray-900">
              ₹{toolkit.price.toLocaleString("en-IN")}
            </span>
            {hasOriginalPrice && (
              <span className="text-sm text-gray-400 line-through">
                ₹{toolkit.originalPrice!.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-sm font-medium text-orange-600 transition-transform group-hover:translate-x-1">
            View Details
            <svg
              className="h-4 w-4"
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

        {toolkit.highlights && toolkit.highlights.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {toolkit.highlights.slice(0, 2).map((highlight, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-orange-50 text-orange-700 hover:bg-orange-100"
              >
                {highlight}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
