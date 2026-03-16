"use client";

import { StorageDomain } from "@/lib/storage/types";

type SignUploadResponse = {
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
  key: string;
  publicUrl: string;
};

type UploadFileInput = {
  domain: StorageDomain;
  file: File;
  onProgress?: (progress: number) => void;
};

export async function uploadFileViaSignedUrl({
  domain,
  file,
  onProgress,
}: UploadFileInput): Promise<{ key: string; publicUrl: string }> {
  const signResponse = await fetch("/api/storage/sign-upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      domain,
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
    }),
  });

  if (!signResponse.ok) {
    const payload = await signResponse.json().catch(() => ({}));
    throw new Error(payload?.error || "Failed to create signed upload URL");
  }

  const signed = (await signResponse.json()) as SignUploadResponse;

  await uploadWithXhr(signed.uploadUrl, file, signed.headers, onProgress);

  return {
    key: signed.key,
    publicUrl: signed.publicUrl,
  };
}

function uploadWithXhr(
  uploadUrl: string,
  file: File,
  headers: Record<string, string>,
  onProgress?: (progress: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);

    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) {
        return;
      }

      const progress = Math.round((event.loaded / event.total) * 100);
      onProgress(progress);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }

      reject(new Error(`Upload failed with status ${xhr.status}`));
    };

    xhr.onerror = () => {
      reject(new Error("Upload request failed"));
    };

    xhr.send(file);
  });
}

export async function deleteStorageObjectClient(
  domain: StorageDomain,
  key: string
): Promise<void> {
  const response = await fetch("/api/storage/object", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ domain, key }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || "Failed to delete file");
  }
}
