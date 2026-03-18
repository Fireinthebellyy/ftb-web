import {
  getStorageDomainBucket,
  getStorageDomainPublicBaseUrl,
  sanitizeFileName,
  storageDomainConfig,
} from "@/lib/storage/domains";
import { getStoragePublicUrl } from "@/lib/storage/public-url";
import { getR2StorageProvider } from "@/lib/storage/r2-provider";
import { StorageDomain } from "@/lib/storage/types";

type SignedUploadInput = {
  domain: StorageDomain;
  userId: string;
  fileName: string;
  contentType: string;
  fileSize: number;
};

export function validateUploadInput({
  domain,
  contentType,
  fileSize,
}: Omit<SignedUploadInput, "fileName" | "userId">): void {
  const config = storageDomainConfig[domain];

  if (!config.allowedMimeTypes.includes(contentType)) {
    throw new Error(`Unsupported file type for ${domain}: ${contentType}`);
  }

  if (fileSize <= 0 || fileSize > config.maxFileSizeBytes) {
    throw new Error(
      `Invalid file size for ${domain}. Max allowed is ${config.maxFileSizeBytes} bytes`
    );
  }
}

export function createStorageObjectKey({
  userId,
  fileName,
}: Pick<SignedUploadInput, "userId" | "fileName">): string {
  const safeName = sanitizeFileName(fileName);
  const timestamp = Date.now();
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `${userId}/${timestamp}-${random}-${safeName}`;
}

export async function getSignedUploadUrl(input: SignedUploadInput) {
  validateUploadInput(input);

  const provider = getR2StorageProvider();
  const bucket = getStorageDomainBucket(input.domain);
  const key = createStorageObjectKey({
    userId: input.userId,
    fileName: input.fileName,
  });

  const signed = await provider.getSignedUploadUrl({
    bucket,
    key,
    contentType: input.contentType,
    cacheControl: storageDomainConfig[input.domain].cacheControl,
  });

  const publicUrl = provider.getPublicUrl({
    bucket,
    key,
    baseUrl: getStorageDomainPublicBaseUrl(input.domain),
  });

  return {
    ...signed,
    key,
    publicUrl,
  };
}

export async function deleteStorageObject(domain: StorageDomain, key: string) {
  const provider = getR2StorageProvider();
  const bucket = getStorageDomainBucket(domain);

  await provider.delete({
    bucket,
    key,
  });
}

export { getStoragePublicUrl };
