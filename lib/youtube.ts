/**
 * Utility functions for YouTube URL parsing and embed link generation.
 */

/**
 * Checks if a string is a YouTube URL.
 */
export function isYouTubeUrl(url?: string | null): boolean {
  if (!url) return false;
  return /(?:youtube\.com|youtu\.be)/i.test(url.trim());
}

/**
 * Extracts an 11-character YouTube video ID from various YouTube URL formats.
 */
export function extractYouTubeVideoId(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Regular expressions covering watch?v=, youtu.be/, embed/, shorts/, live/
  const regexes = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/s]{11})/i,
    /^[a-zA-Z0-9_-]{11}$/, // Direct video ID
  ];

  for (const regex of regexes) {
    const match = trimmed.match(regex);
    if (match && match[1]) {
      return match[1];
    }
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
