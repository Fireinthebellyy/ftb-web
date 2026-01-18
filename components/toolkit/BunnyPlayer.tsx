"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, Play, Loader2 } from "lucide-react";

interface BunnyPlayerProps {
  videoId: string;
  title?: string;
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  isCompleted?: boolean;
  onToggleComplete?: () => void;
}

export default function BunnyPlayer({
  videoId,
  title = "Video content",
  className,
  autoplay = false,
  muted = false,
  controls = true,
  isCompleted = false,
  onToggleComplete,
}: BunnyPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideoUrl = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `/api/video-access?videoId=${encodeURIComponent(videoId)}`
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to load video");
        }

        const data = await response.json();
        setVideoUrl(data.videoUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load video");
      } finally {
        setLoading(false);
      }
    };

    fetchVideoUrl();
  }, [videoId]);

  const getVideoUrl = () => {
    if (!videoUrl) return "";
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

  if (loading) {
    return (
      <div className="space-y-4">
        <div
          className={cn(
            "relative flex items-center justify-center overflow-hidden rounded-xl bg-gray-900 shadow-xl",
            className
          )}
          style={{ paddingBottom: "56.25%" }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        </div>
      </div>
    );
  }

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
