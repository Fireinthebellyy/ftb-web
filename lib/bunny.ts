import crypto from "crypto";

export function getBunnyExpirySeconds(): number {
  const envValue = process.env.BUNNY_TOKEN_EXPIRY_SECONDS;
  if (!envValue) return 900; // Default 15 mins
  const parsed = parseInt(envValue, 10);
  return isNaN(parsed) ? 900 : parsed;
}

export function generateBunnyEmbedUrl(videoId: string): string {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID!;
  const tokenSecret = process.env.BUNNY_TOKEN_SECRET!;
  const expirySeconds = Number(process.env.BUNNY_TOKEN_EXPIRY_SECONDS ?? 900);

  const expires = Math.floor(Date.now() / 1000) + expirySeconds;

  // Bunny expects: HEX(SHA256(secret + videoId + expires))
  // Format: secret + videoId + expires (concatenated as strings)
  const stringToHash = `${tokenSecret}${videoId}${expires}`;

  // Generate SHA256 hash and convert to HEX (not base64, not HMAC)
  const token = crypto
    .createHash("sha256")
    .update(stringToHash)
    .digest("hex");

  // URL format: ?token={HEX_TOKEN}&expires={EXPIRES} (separate parameters)
  const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expires}`;

  return embedUrl;
}
