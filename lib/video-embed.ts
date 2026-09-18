import { extractYouTubeVideoId } from "./youtube";

export type VideoProvider = "youtube" | "instagram" | "bunny" | "direct";

export interface EmbedInfo {
  provider: VideoProvider;
  embedUrl: string;
  originalUrl: string;
  videoId?: string;
}

/**
 * Extracts Instagram post or reel ID from various Instagram URL formats.
 * e.g.,
 * - https://www.instagram.com/p/C3abc123/
 * - https://www.instagram.com/reel/C3abc123/
 * - https://www.instagram.com/reels/C3abc123/
 * - https://www.instagram.com/tv/C3abc123/
 */
export function extractInstagramId(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(
    /(?:instagram\.com\/(?:p|reel|reels|tv)\/)([a-zA-Z0-9_-]+)/i
  );
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

/**
 * Extracts Bunny CDN video stream embed details or returns embed URL.
 * e.g.,
 * - https://iframe.mediadelivery.net/embed/12345/abc-def-123
 * - https://video.bunnycdn.com/play/12345/abc-def-123
 */
export function extractBunnyEmbed(url?: string | null): { embedUrl: string; videoId?: string } | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Pattern: iframe.mediadelivery.net/embed/{libraryId}/{videoId}
  const mediaDeliveryMatch = trimmed.match(
    /(?:iframe\.mediadelivery\.net\/embed\/)(\d+)\/([a-zA-Z0-9_-]+)/i
  );
  if (mediaDeliveryMatch) {
    const libraryId = mediaDeliveryMatch[1];
    const videoId = mediaDeliveryMatch[2];
    return {
      embedUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&preload=true&responsive=true`,
      videoId,
    };
  }

  // Pattern: video.bunnycdn.com/play/{libraryId}/{videoId}
  const bunnyPlayMatch = trimmed.match(
    /(?:video\.bunnycdn\.com\/play\/)(\d+)\/([a-zA-Z0-9_-]+)/i
  );
  if (bunnyPlayMatch) {
    const libraryId = bunnyPlayMatch[1];
    const videoId = bunnyPlayMatch[2];
    return {
      embedUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&preload=true&responsive=true`,
      videoId,
    };
  }

  // If URL already points to mediadelivery.net or bunnycdn stream iframe
  if (trimmed.includes("mediadelivery.net") || trimmed.includes("bunnycdn.com")) {
    return {
      embedUrl: trimmed,
    };
  }

  return null;
}

/**
 * Checks if the URL points to a direct video file.
 */
export function isDirectVideoUrl(url?: string | null): boolean {
  if (!url) return null;
  const clean = url.trim().split("?")[0].toLowerCase();
  return (
    clean.endsWith(".mp4") ||
    clean.endsWith(".webm") ||
    clean.endsWith(".ogg") ||
    clean.endsWith(".mov") ||
    clean.endsWith(".m3u8")
  );
}

/**
 * Returns an embed info object for supported video links (YouTube, Instagram, Bunny CDN, or direct video).
 */
export function getVideoEmbedInfo(url?: string | null): EmbedInfo | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Check YouTube
  const ytId = extractYouTubeVideoId(trimmed);
  if (ytId) {
    return {
      provider: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1`,
      originalUrl: trimmed,
      videoId: ytId,
    };
  }

  // Check Instagram
  const igId = extractInstagramId(trimmed);
  if (igId) {
    return {
      provider: "instagram",
      embedUrl: `https://www.instagram.com/p/${igId}/embed/`,
      originalUrl: trimmed,
      videoId: igId,
    };
  }

  // Check Bunny CDN
  const bunnyInfo = extractBunnyEmbed(trimmed);
  if (bunnyInfo) {
    return {
      provider: "bunny",
      embedUrl: bunnyInfo.embedUrl,
      originalUrl: trimmed,
      videoId: bunnyInfo.videoId,
    };
  }

  // Check Direct Video
  if (isDirectVideoUrl(trimmed)) {
    return {
      provider: "direct",
      embedUrl: trimmed,
      originalUrl: trimmed,
    };
  }

  return null;
}
