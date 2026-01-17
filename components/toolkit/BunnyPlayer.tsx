"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, Play } from "lucide-react";

interface BunnyPlayerProps {
  videoUrl: string;
  title?: string;
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  isCompleted?: boolean;
  onToggleComplete?: () => void;
}

export default function BunnyPlayer({
  videoUrl,
  title = "Video content",
  className,
  autoplay = false,
  muted = false,
  controls = true,
  isCompleted = false,
  onToggleComplete,
}: BunnyPlayerProps) {
  const getVideoUrl = () => {
    try {
      const url = new URL(videoUrl);
      url.searchParams.set("autoplay", autoplay ? "true" : "false");
      url.searchParams.set("muted", muted ? "true" : "false");
      url.searchParams.set("preload", "true");
      url.searchParams.set("responsive", "true");
      if (!controls) {
        url.searchParams.set("controls", "false");
      }
      return url.toString();
    } catch {
      return videoUrl;
    }
  };

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
          src={getVideoUrl()}
          className="absolute inset-0 h-full w-full"
          style={{ border: 0 }}
          allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
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
