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
        "group cursor-pointer gap-0 overflow-hidden border bg-white py-0 transition-shadow hover:shadow-md",
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
          <div className="flex h-full items-center justify-center bg-gray-100">
            <span className="text-4xl font-bold text-gray-300">
              {toolkit.title.charAt(0)}
            </span>
          </div>
        )}

        {toolkit.category && (
          <Badge variant="secondary" className="absolute top-3 left-3">
            {toolkit.category}
          </Badge>
        )}

        {hasVideo && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-medium text-gray-700">
            <Play className="h-3 w-3" />
            Preview
          </div>
        )}

        {hasOriginalPrice && (
          <Badge className="absolute top-3 right-3 bg-orange-500 text-white hover:bg-green-700">
            Sale
          </Badge>
        )}
      </div>

      <CardContent className="p-3 sm:p-4">
        <p className="mb-1.5 text-xs text-gray-500">
          {toolkit.creatorName && (
            <span className="font-medium text-gray-700">
              {toolkit.creatorName}
            </span>
          )}
          {toolkit.creatorName && toolkit.lessonCount && (
            <span className="mx-1.5">•</span>
          )}
          {toolkit.lessonCount && <span>{toolkit.lessonCount} lessons</span>}
          {toolkit.totalDuration && (
            <>
              <span className="mx-1.5">•</span>
              <span>{toolkit.totalDuration}</span>
            </>
          )}
        </p>

        <h3 className="mb-1.5 text-lg font-semibold text-gray-900 transition-colors group-hover:text-gray-700">
          {toolkit.title.charAt(0).toUpperCase() + toolkit.title.slice(1)}
        </h3>

        <p className="mb-2 line-clamp-2 text-sm text-gray-600">
          {toolkit.description.charAt(0).toUpperCase() +
            toolkit.description.slice(1)}
        </p>

        {toolkit.highlights && toolkit.highlights.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {toolkit.highlights.slice(0, 2).map((highlight, index) => (
              <Badge key={index} variant="outline" className="text-gray-600">
                {highlight}
              </Badge>
            ))}
          </div>
        )}

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

          <div className="group-hover:text-primary flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors group-hover:translate-x-1">
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
      </CardContent>
    </Card>
  );
}
