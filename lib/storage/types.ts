export type StorageDomain =
  | "opportunity-images"
  | "ungatekeep-images"
  | "avatar-images"
  | "opportunity-attachments";

export interface GetSignedUploadUrlInput {
  bucket: string;
  key: string;
  contentType: string;
  cacheControl?: string;
  expiresInSeconds?: number;
}

export interface UploadObjectInput {
  bucket: string;
  key: string;
  body: Buffer | Uint8Array | string;
  contentType: string;
  cacheControl?: string;
}

export interface DeleteObjectInput {
  bucket: string;
  key: string;
}

export interface GetPublicUrlInput {
  bucket: string;
  key: string;
  baseUrl: string;
}

export interface SignedUploadResult {
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
}

export interface StorageProvider {
  upload(input: UploadObjectInput): Promise<void>;
  delete(input: DeleteObjectInput): Promise<void>;
  getPublicUrl(input: GetPublicUrlInput): string;
  getSignedUploadUrl(
    input: GetSignedUploadUrlInput
  ): Promise<SignedUploadResult>;
}
