import { StorageDomain } from "@/lib/storage/types";

const storageDomainPublicBaseUrlMap: Record<StorageDomain, string | undefined> =
  {
    "opportunity-images":
      process.env.NEXT_PUBLIC_R2_OPPORTUNITY_IMAGES_BASE_URL,
    "ungatekeep-images": process.env.NEXT_PUBLIC_R2_UNGATEKEEP_IMAGES_BASE_URL,
    "avatar-images": process.env.NEXT_PUBLIC_R2_AVATAR_IMAGES_BASE_URL,
    "opportunity-attachments":
      process.env.NEXT_PUBLIC_R2_OPPORTUNITY_ATTACHMENTS_BASE_URL,
  };

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

export function isAbsoluteOrLocalUrl(value: string): boolean {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    (value.startsWith("/") && !value.startsWith("//"))
  );
}

export function getStoragePublicUrl(
  domain: StorageDomain,
  key: string
): string {
  if (!key) {
    return "";
  }

  if (isAbsoluteOrLocalUrl(key)) {
    return key;
  }

  const baseUrl = storageDomainPublicBaseUrlMap[domain];
  if (!baseUrl) {
    throw new Error(
      `Missing required environment variable for public URL on domain: ${domain}`
    );
  }

  return `${normalizeBaseUrl(baseUrl)}/${encodeURIComponent(key).replace(/%2F/g, "/")}`;
}

export function tryGetStoragePublicUrl(
  domain: StorageDomain,
  key: string
): string {
  if (!key) {
    return "";
  }

  if (isAbsoluteOrLocalUrl(key)) {
    return key;
  }

  try {
    return getStoragePublicUrl(domain, key);
  } catch {
    return key;
  }
}

export function listConfiguredStoragePublicHosts(): string[] {
  const hosts = new Set<string>();

  (Object.keys(storageDomainPublicBaseUrlMap) as StorageDomain[]).forEach(
    (domain) => {
      const raw = storageDomainPublicBaseUrlMap[domain];
      if (!raw) {
        return;
      }

      try {
        const url = new URL(raw);
        hosts.add(url.hostname);
      } catch {
        // ignore malformed config to avoid breaking boot
      }
    }
  );

  return [...hosts];
}
