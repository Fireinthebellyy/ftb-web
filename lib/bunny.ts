import crypto from "crypto";

export function getBunnyExpirySeconds(): number {
  const envValue = process.env.BUNNY_TOKEN_EXPIRY_SECONDS;
  if (!envValue) return 86400; // Default 24 hours for seamless session viewing
  const parsed = parseInt(envValue, 10);
  return isNaN(parsed) ? 86400 : parsed;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isBunnyHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "iframe.mediadelivery.net" ||
    host === "video.bunnycdn.com" ||
    host.endsWith(".mediadelivery.net") ||
    host.endsWith(".b-cdn.net") ||
    host.endsWith(".bunnycdn.com") ||
    host.endsWith(".bunny.net")
  );
}

export function extractBunnyVideoDetails(input?: string | null): {
  videoId: string;
  libraryId?: string;
} | null {
  if (!input || typeof input !== "string") return null;
  let cleaned = input.trim();
  if (!cleaned) return null;

  // If plain UUID was provided
  if (UUID_REGEX.test(cleaned)) {
    return { videoId: cleaned };
  }

  // If iframe snippet was provided
  if (cleaned.includes("<iframe")) {
    const match = cleaned.match(/src=["']([^"']*)["']/i);
    if (match && match[1]) {
      cleaned = match[1].trim();
    } else {
      return null;
    }
  }

  try {
    const url = new URL(
      cleaned.startsWith("//") ? `https:${cleaned}` : cleaned
    );
    if (!isBunnyHostname(url.hostname)) {
      return null;
    }

    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length === 0) return null;

    const uuidIndex = segments.findIndex((seg) => UUID_REGEX.test(seg));
    if (uuidIndex === -1) {
      return null;
    }

    const videoId = segments[uuidIndex];
    const prevSegment = uuidIndex > 0 ? segments[uuidIndex - 1] : undefined;
    const libraryId =
      prevSegment && /^\d+$/.test(prevSegment) ? prevSegment : undefined;

    return { videoId, libraryId };
  } catch {
    return null;
  }
}

export function cleanBunnyVideoUrl(input?: string | null): string | null {
  const details = extractBunnyVideoDetails(input);
  if (!details?.videoId) return input?.trim() || null;
  if (details.libraryId) {
    return `https://iframe.mediadelivery.net/embed/${details.libraryId}/${details.videoId}`;
  }
  return details.videoId;
}

export function isBunnyVideo(input?: string | null): boolean {
  return extractBunnyVideoDetails(input) !== null;
}

export function generateBunnyEmbedUrl(
  videoId: string,
  customLibraryId?: string
): string {
  const libraryId = customLibraryId || process.env.BUNNY_STREAM_LIBRARY_ID;
  const tokenSecret = process.env.BUNNY_TOKEN_SECRET;
  const expirySeconds = getBunnyExpirySeconds();

  if (!libraryId || !tokenSecret) {
    throw new Error(
      "Missing Bunny credentials: BUNNY_STREAM_LIBRARY_ID and/or BUNNY_TOKEN_SECRET are required"
    );
  }

  const expires = Math.floor(Date.now() / 1000) + expirySeconds;

  // Bunny expects: HEX(SHA256(secret + videoId + expires))
  // Format: secret + videoId + expires (concatenated as strings)
  const stringToHash = `${tokenSecret}${videoId}${expires}`;

  // Generate SHA256 hash and convert to HEX (not base64, not HMAC)
  const token = crypto.createHash("sha256").update(stringToHash).digest("hex");

  // URL format: ?token={HEX_TOKEN}&expires={EXPIRES} (separate parameters)
  const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expires}`;

  return embedUrl;
}
