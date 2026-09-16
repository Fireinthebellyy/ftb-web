"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface CohortBunnyPlayerProps {
  videoUrl: string;
  title?: string;
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
}

export default function CohortBunnyPlayer({
  videoUrl,
  title = "Cohort video",
  className,
  autoplay = false,
  muted = false,
  controls = true,
}: CohortBunnyPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      return "";
    }
  };

  useEffect(() => {
    if (!videoUrl) {
      setError("No video URL available");
      setLoading(false);
      return;
    }

    try {
      new URL(videoUrl);
      setError(null);
    } catch {
      setError("Invalid video URL");
    }
  }, [videoUrl]);

  if (error) {
    return (
      <div className="space-y-4">
        <div
          className={cn(
            "relative flex items-center justify-center overflow-hidden rounded-xl bg-red-50 shadow-xl",
            className
          )}
          style={{ paddingBottom: "56.25%" }}
        >
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative overflow-hidden rounded-xl bg-gray-900 shadow-xl",
          className
        )}
        style={{ paddingBottom: "56.25%" }}
      >
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}

        <iframe
          src={getVideoUrl()}
          className="absolute inset-0 h-full w-full"
          style={{ border: 0 }}
          allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
          allowFullScreen
          title={title}
          loading="lazy"
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  );
}