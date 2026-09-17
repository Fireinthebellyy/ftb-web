"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CohortBunnyPlayerProps {
  videoUrl?: string | null;
  contentId?: string | null;
  cohortId?: string | null;
  title?: string;
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
}

export default function CohortBunnyPlayer({
  videoUrl,
  contentId,
  cohortId,
  title = "Cohort video",
  className,
  autoplay = false,
  muted = false,
  controls = true,
}: CohortBunnyPlayerProps) {
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadVideo() {
      if (!videoUrl && !contentId) {
        setError("No video URL or ID provided");
        setLoading(false);
        return;
      }

      // If videoUrl is already a fully signed URL with token & expires, we can use it directly
      if (
        videoUrl &&
        videoUrl.startsWith("http") &&
        videoUrl.includes("token=") &&
        videoUrl.includes("expires=")
      ) {
        setResolvedVideoUrl(videoUrl);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (contentId) {
          params.set("cohortContentId", contentId);
        }
        if (videoUrl) {
          params.set("videoUrl", videoUrl);
        }
        if (cohortId) {
          params.set("cohortId", cohortId);
        }

        const response = await fetch(`/api/video-access?${params.toString()}`);
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load secure video player");
        }

        const data = await response.json();
        if (isMounted) {
          setResolvedVideoUrl(data.videoUrl);
        }
      } catch (err) {
        if (isMounted) {
          if (
            videoUrl &&
            videoUrl.startsWith("http") &&
            !videoUrl.includes("mediadelivery.net")
          ) {
            setResolvedVideoUrl(videoUrl);
          } else {
            setError(
              err instanceof Error ? err.message : "Failed to load video"
            );
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadVideo();

    return () => {
      isMounted = false;
    };
  }, [videoUrl, contentId, cohortId]);

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
    } catch {
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
            "relative flex items-center justify-center overflow-hidden rounded-xl border border-red-200 bg-red-50 shadow-sm",
            className
          )}
          style={{ paddingBottom: "56.25%" }}
        >
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
            <p className="text-sm font-medium text-red-600">{error}</p>
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
          src={getEmbedSrc()}
          className="absolute inset-0 h-full w-full"
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
