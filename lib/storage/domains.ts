import { StorageDomain } from "@/lib/storage/types";

type StorageDomainConfig = {
  bucketEnvVar: string;
  publicBaseUrlEnvVar: string;
  maxFileSizeBytes: number;
  allowedMimeTypes: string[];
  cacheControl: string;
};

const MEGABYTE = 1024 * 1024;

export const storageDomainConfig: Record<StorageDomain, StorageDomainConfig> = {
  "opportunity-images": {
    bucketEnvVar: "R2_BUCKET_OPPORTUNITY_IMAGES",
    publicBaseUrlEnvVar: "NEXT_PUBLIC_R2_OPPORTUNITY_IMAGES_BASE_URL",
    maxFileSizeBytes: 5 * MEGABYTE,
    allowedMimeTypes: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
    ],
    cacheControl: "public, max-age=31536000, immutable",
  },
  "ungatekeep-images": {
    bucketEnvVar: "R2_BUCKET_UNGATEKEEP_IMAGES",
    publicBaseUrlEnvVar: "NEXT_PUBLIC_R2_UNGATEKEEP_IMAGES_BASE_URL",
    maxFileSizeBytes: 5 * MEGABYTE,
    allowedMimeTypes: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
    ],
    cacheControl: "public, max-age=31536000, immutable",
  },
  "avatar-images": {
    bucketEnvVar: "R2_BUCKET_AVATAR_IMAGES",
    publicBaseUrlEnvVar: "NEXT_PUBLIC_R2_AVATAR_IMAGES_BASE_URL",
    maxFileSizeBytes: 5 * MEGABYTE,
    allowedMimeTypes: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
    ],
    cacheControl: "public, max-age=31536000, immutable",
  },
  "opportunity-attachments": {
    bucketEnvVar: "R2_BUCKET_OPPORTUNITY_ATTACHMENTS",
    publicBaseUrlEnvVar: "NEXT_PUBLIC_R2_OPPORTUNITY_ATTACHMENTS_BASE_URL",
    maxFileSizeBytes: 10 * MEGABYTE,
    allowedMimeTypes: [
      "application/pdf",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    cacheControl: "public, max-age=86400, s-maxage=604800",
  },
};

export function getStorageDomainBucket(domain: StorageDomain): string {
  const envName = storageDomainConfig[domain].bucketEnvVar;
  const bucket = process.env[envName];

  if (!bucket) {
    throw new Error(`Missing required environment variable: ${envName}`);
  }

  return bucket;
}

export function getStorageDomainPublicBaseUrl(domain: StorageDomain): string {
  const envName = storageDomainConfig[domain].publicBaseUrlEnvVar;
  const value = process.env[envName];

  if (!value) {
    throw new Error(`Missing required environment variable: ${envName}`);
  }

  return value;
}

export function sanitizeFileName(fileName: string): string {
  const trimmed = fileName.trim().toLowerCase();
  const safe = trimmed.replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-");
  return safe || "file";
}

export function getExtension(fileName: string): string {
  const parts = fileName.split(".");
  if (parts.length < 2) {
    return "";
  }
  return parts[parts.length - 1].toLowerCase();
}
