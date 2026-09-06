/**
 * Utility functions for YouTube URL parsing and embed link generation.
 */

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

function getNormalizedHostname(url: string): string | null {
  try {
    const parsed = new URL(url.includes("://") ? url : `https://${url}`);
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Checks if a string is a YouTube URL.
 */
export function isYouTubeUrl(url?: string | null): boolean {
  if (!url) return false;
  const hostname = getNormalizedHostname(url.trim());
  if (!hostname) return false;
  return YOUTUBE_HOSTS.has(hostname) || hostname.endsWith(".youtube.com");
}

/**
 * Extracts an 11-character YouTube video ID from various YouTube URL formats.
 */
export function extractYouTubeVideoId(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Direct video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Ensure domain is a valid YouTube host before URL regex parsing
  const hostname = getNormalizedHostname(trimmed);
  if (!hostname || (!YOUTUBE_HOSTS.has(hostname) && !hostname.endsWith(".youtube.com"))) {
    return null;
  }

  try {
    const parsed = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);

    // youtu.be/<id>
    if (parsed.hostname.toLowerCase().endsWith("youtu.be")) {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
        return id;
      }
    }

    // youtube.com/watch?v=<id>
    const vParam = parsed.searchParams.get("v");
    if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
      return vParam;
    }

    // youtube.com/embed/<id>, /shorts/<id>, /live/<id>, /v/<id>
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const prefixIndex = pathParts.findIndex((part) =>
      ["embed", "shorts", "live", "v"].includes(part.toLowerCase())
    );
    if (prefixIndex !== -1 && pathParts[prefixIndex + 1]) {
      const potentialId = pathParts[prefixIndex + 1];
      if (/^[a-zA-Z0-9_-]{11}$/.test(potentialId)) {
        return potentialId;
      }
    }
  } catch {
    // If URL parsing fails, continue to fallback regex
  }

  // Fallback regex covering edge cases with exact 11-char ID validation
  const fallbackRegex =
    /(?:youtube\.com\/(?:[^\/\s]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const match = trimmed.match(fallbackRegex);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * Returns a privacy-enhanced YouTube embed URL with autoplay enabled.
 */
export function getYouTubeEmbedUrl(urlOrId?: string | null): string | null {
  const videoId = extractYouTubeVideoId(urlOrId);
  if (!videoId) return null;
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
}

/**
 * Returns high quality YouTube thumbnail URL for a video.
 */
export function getYouTubeThumbnailUrl(
  urlOrId?: string | null,
  quality: "hqdefault" | "mqdefault" | "maxresdefault" = "hqdefault"
): string | null {
  const videoId = extractYouTubeVideoId(urlOrId);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}
