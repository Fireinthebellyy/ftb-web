import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StorageProvider } from "@/lib/storage/types";

const DEFAULT_SIGNED_UPLOAD_EXPIRY_SECONDS = 300;

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function createR2Client(): S3Client {
  const accountId = getRequiredEnvVar("R2_ACCOUNT_ID");
  const accessKeyId = getRequiredEnvVar("R2_ACCESS_KEY_ID");
  const secretAccessKey = getRequiredEnvVar("R2_SECRET_ACCESS_KEY");

  const endpoint =
    process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

class R2StorageProvider implements StorageProvider {
  private client = createR2Client();

  async upload({
    bucket,
    key,
    body,
    contentType,
    cacheControl,
  }: Parameters<StorageProvider["upload"]>[0]): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    });

    await this.client.send(command);
  }

  async delete({
    bucket,
    key,
  }: Parameters<StorageProvider["delete"]>[0]): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  getPublicUrl({
    baseUrl,
    key,
  }: Parameters<StorageProvider["getPublicUrl"]>[0]): string {
    const normalizedBaseUrl = baseUrl.endsWith("/")
      ? baseUrl.slice(0, -1)
      : baseUrl;

    const encodedKey = encodeURIComponent(key).replace(/%2F/g, "/");
    return `${normalizedBaseUrl}/${encodedKey}`;
  }

  async getSignedUploadUrl({
    bucket,
    key,
    contentType,
    cacheControl,
    expiresInSeconds,
  }: Parameters<StorageProvider["getSignedUploadUrl"]>[0]) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      CacheControl: cacheControl,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn:
        expiresInSeconds && expiresInSeconds > 0
          ? expiresInSeconds
          : DEFAULT_SIGNED_UPLOAD_EXPIRY_SECONDS,
    });

    return {
      uploadUrl,
      method: "PUT" as const,
      headers: {
        "Content-Type": contentType,
        ...(cacheControl ? { "Cache-Control": cacheControl } : {}),
      },
    };
  }
}

let storageProvider: StorageProvider | null = null;

export function getR2StorageProvider(): StorageProvider {
  if (!storageProvider) {
    storageProvider = new R2StorageProvider();
  }

  return storageProvider;
}
