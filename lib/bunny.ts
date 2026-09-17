import crypto from "crypto";

export function getBunnyExpirySeconds(): number {
  const envValue = process.env.BUNNY_TOKEN_EXPIRY_SECONDS;
  if (!envValue) return 900; // Default 15 mins
  const parsed = parseInt(envValue, 10);
  return isNaN(parsed) ? 900 : parsed;
}

export function extractBunnyVideoDetails(input?: string | null): {
  videoId: string;
  libraryId?: string;
} | null {
  if (!input) return null;
  let cleaned = input.trim();
  if (!cleaned) return null;

  // If iframe snippet was provided
  if (cleaned.includes("<iframe")) {
    const match = cleaned.match(/src=["']([^"']*)["']/);
    if (match && match[1]) {
      cleaned = match[1].trim();
    }
  }

  // Remove query string and hash
  const urlWithoutQuery = cleaned.split("?")[0].split("#")[0];

  // Check if it is a URL with path segments
  if (urlWithoutQuery.includes("/")) {
    const parts = urlWithoutQuery.split("/").filter(Boolean);
    const lastPart = parts[parts.length - 1];
    const secondLastPart = parts[parts.length - 2];

    // Check if second last part is a numeric libraryId (e.g. embed/626882/uuid)
    if (secondLastPart && /^\d+$/.test(secondLastPart)) {
      return { videoId: lastPart, libraryId: secondLastPart };
    }
    return { videoId: lastPart };
  }

  // If it is just a video ID (UUID)
  return { videoId: urlWithoutQuery };
}

export function isBunnyVideo(input?: string | null): boolean {
  if (!input) return false;
  const cleaned = input.trim();
  if (!cleaned) return false;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(cleaned)) return true;

  if (
    cleaned.includes("mediadelivery.net") ||
    cleaned.includes("bunnycdn.com") ||
    cleaned.includes("bunny.net") ||
    cleaned.includes("<iframe")
  ) {
    return true;
  }

  return false;
}

export function generateBunnyEmbedUrl(
  videoId: string,
  customLibraryId?: string
): string {
  const libraryId = customLibraryId || process.env.BUNNY_STREAM_LIBRARY_ID;
  const tokenSecret = process.env.BUNNY_TOKEN_SECRET;
  const expirySeconds = Number(process.env.BUNNY_TOKEN_EXPIRY_SECONDS ?? 900);

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
