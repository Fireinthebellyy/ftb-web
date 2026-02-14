"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BunnyPlayerProps {
  videoId: string;
  title?: string;
  className?: string;
}

export default function BunnyPlayer({
  videoId,
  title = "Video content",
  className,
}: BunnyPlayerProps) {
  const libraryId = process.env.NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID;
  
  if (!libraryId) {
    return (
      <div className={cn("rounded-xl bg-gray-900 p-8 text-center text-white", className)}>
        <p>Video player not configured</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-gray-900 shadow-xl",
        className
      )}
      style={{ paddingBottom: "56.25%" }}
    >
      <iframe
        src={`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`}
        className="absolute inset-0 h-full w-full"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title={title}
        loading="lazy"
      />
    </div>
  );
}
