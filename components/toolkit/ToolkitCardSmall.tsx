"use client";

import React from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import posthog from "posthog-js";
import { Toolkit } from "@/types/interfaces";

interface ToolkitCardSmallProps {
  toolkit: Toolkit;
  onClick?: () => void;
  className?: string;
}

export default function ToolkitCardSmall({
  toolkit,
  onClick,
  className,
}: ToolkitCardSmallProps) {
  const handleClick = (e: React.MouseEvent) => {
    posthog.capture("toolkit_card_clicked", { toolkit_id: toolkit.id, title: toolkit.title });
    if (onClick) onClick();
  }

  return (
    <Card
      className={cn(
        "group flex cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-md",
        className
      )}
      onClick={handleClick}
    >
      <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden bg-gray-100">
        {toolkit.coverImageUrl ? (
          <Image
            src={toolkit.coverImageUrl}
            alt={toolkit.title}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-105"
            sizes="128px"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100">
            <span className="text-xl font-bold text-orange-300">
              {toolkit.title.charAt(0)}
            </span>
          </div>
        )}
        {toolkit.videoUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="rounded-full bg-white/90 p-1.5">
              <Play className="h-3 w-3 fill-orange-500 text-orange-500" />
            </div>
          </div>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col justify-center p-3">
        <div className="mb-1 flex items-center gap-1.5">
          {toolkit.category && (
            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
              {toolkit.category}
            </Badge>
          )}
        </div>

        <h4 className="line-clamp-1 text-sm font-semibold text-gray-900 transition-colors group-hover:text-orange-600">
          {toolkit.title}
        </h4>

        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-base font-bold text-gray-900">
            ₹{toolkit.price.toLocaleString("en-IN")}
          </span>
          {toolkit.originalPrice && toolkit.originalPrice > toolkit.price && (
            <span className="text-xs text-gray-400 line-through">
              ₹{toolkit.originalPrice.toLocaleString("en-IN")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
