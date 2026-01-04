"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface VimeoPlayerProps {
  videoId: string;
  title?: string;
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
}

export default function VimeoPlayer({
  videoId,
  title = "Video content",
  className,
  autoplay = false,
  muted = false,
  controls = true,
}: VimeoPlayerProps) {
  const params = new URLSearchParams({
    title: "0",
    byline: "0",
    portrait: "0",
    color: "F97316",
    dnt: "1",
    autoplay: autoplay ? "1" : "0",
    muted: muted ? "1" : "0",
    controls: controls ? "1" : "0",
    rel: "0",
  });

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-gray-900 shadow-xl",
        className
      )}
      style={{ paddingBottom: "56.25%" }}
    >
      <iframe
        src={`https://player.vimeo.com/video/${videoId}?${params.toString()}`}
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
