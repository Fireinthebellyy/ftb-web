"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SprintBunnyPlayerProps {
  videoUrl?: string | null;
  sprintId: string | null;
  title?: string;
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
}

export default function SprintBunnyPlayer({
  videoUrl,
  sprintId,
  title = "Sprint video",
  className,
  autoplay = false,
  muted = false,
  controls = true,
}: SprintBunnyPlayerProps) {
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSecureVideo = useCallback(async () => {
    if (!videoUrl ) {
      setError("No video URL or ID provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (videoUrl) {
        params.set("videoUrl", videoUrl);
      }
      if (sprintId) {
        params.set("sprintId", sprintId);
      }

      // Always request fresh, authenticated signed URL from backend
      const response = await fetch(`/api/video-access/sprints?${params.toString()}`);
      console.log("respons of sprints",response);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load secure video player");
      }

      const data = await response.json();
      console.log("data of sprints",data);
      setError(null);
      setResolvedVideoUrl(data.videoUrl);
    } catch (err) {
      if (
        videoUrl &&
        videoUrl.startsWith("http") &&
        !videoUrl.includes("mediadelivery.net")
      ) {
        setResolvedVideoUrl(videoUrl);
        setError(null);
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to load video"
        );
      }
    } finally {
      setLoading(false);
    }
  }, [videoUrl, sprintId]);

  useEffect(() => {
    loadSecureVideo();
  }, [loadSecureVideo]);

  const getEmbedSrc = () => {
    if (!resolvedVideoUrl) return "";
    try {
      const url = new URL(resolvedVideoUrl);

      url.searchParams.set("autoplay", autoplay ? "true" : "false");
      url.searchParams.set("muted", muted ? "true" : "false");
      url.searchParams.set("preload", "true");
      url.searchParams.set("responsive", "true");

      if (!controls) {
        url.searchParams.set("controls", "false");
      }
      return url.toString();
    } 
    catch {
      return resolvedVideoUrl;
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
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <span className="text-xs text-gray-300">Authenticating video access...</span>
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
            "relative flex items-center justify-center overflow-hidden rounded-xl border border-red-200 bg-red-50 shadow-sm",
            className
          )}
          style={{ paddingBottom: "56.25%" }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center gap-3">
            <p className="text-sm font-medium text-red-600">{error}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadSecureVideo()}
              className="text-xs border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry Access
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-xl bg-black shadow-xl",
          className
        )}
        style={{ paddingBottom: "56.25%" }}
      >
        <iframe
          src={getEmbedSrc()}
          className="absolute top-0 left-0 h-full w-full border-0"
          style={{ border: 0 }}
          allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
          allowFullScreen
          title={title}
          loading="lazy"
        />
      </div>
    </div>
  );
}
