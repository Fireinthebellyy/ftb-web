import { extractYouTubeVideoId, getYouTubeEmbedUrl } from "./youtube";

export type VideoProvider = "youtube" | "instagram";

export interface EmbedInfo {
  provider: VideoProvider;
  embedUrl: string;
  originalUrl: string;
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
 * Returns an embed info object for supported video links (YouTube or Instagram).
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
      embedUrl: getYouTubeEmbedUrl(ytId) || `https://www.youtube-nocookie.com/embed/${ytId}`,
      originalUrl: trimmed,
    };
  }

  // Check Instagram
  const igId = extractInstagramId(trimmed);
  if (igId) {
    return {
      provider: "instagram",
      embedUrl: `https://www.instagram.com/p/${igId}/embed/captioned/`,
      originalUrl: trimmed,
    };
  }

  return null;
}
