"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, Play } from "lucide-react";

interface VimeoPlayerProps {
  videoId: string;
  title?: string;
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  isCompleted?: boolean;
  onToggleComplete?: () => void;
}

export default function VimeoPlayer({
  videoId,
  title = "Video content",
  className,
  autoplay = false,
  muted = false,
  controls = true,
  isCompleted = false,
  onToggleComplete,
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
    <div className="space-y-4">
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

      {onToggleComplete && (
        <Button
          onClick={onToggleComplete}
          variant={isCompleted ? "default" : "outline"}
          className={cn(
            "w-full transition-all",
            isCompleted && "bg-green-600 text-white hover:bg-green-700"
          )}
        >
          {isCompleted ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Completed
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Mark as Complete
            </>
          )}
        </Button>
      )}
    </div>
  );
}
