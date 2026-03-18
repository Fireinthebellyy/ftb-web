import { auth } from "@/lib/auth";

type SessionResult = Awaited<ReturnType<typeof auth.api.getSession>>;

interface CacheEntry {
  expiresAt: number;
  value?: SessionResult;
  promise?: Promise<SessionResult>;
}

const SESSION_TTL_MS = 3000;
const MAX_CACHE_ENTRIES = 500;
const sessionCache = new Map<string, CacheEntry>();

function evictExpired(now: number) {
  for (const [key, entry] of sessionCache.entries()) {
    if (entry.expiresAt <= now && !entry.promise) {
      sessionCache.delete(key);
    }
  }
}

function trimCacheIfNeeded() {
  if (sessionCache.size <= MAX_CACHE_ENTRIES) {
    return;
  }

  const keys = sessionCache.keys();
  const removeCount = sessionCache.size - MAX_CACHE_ENTRIES;
  for (let i = 0; i < removeCount; i += 1) {
    const key = keys.next().value;
    if (!key) {
      break;
    }
    sessionCache.delete(key);
  }
}

export async function getSessionCached(requestHeaders: Headers) {
  const cookie = requestHeaders.get("cookie") ?? "";
  const key =
    cookie.length > 0
      ? cookie
      : `no-cookie:${requestHeaders.get("x-forwarded-for") ?? "unknown"}`;
  const now = Date.now();

  evictExpired(now);

  const cached = sessionCache.get(key);
  if (cached && cached.expiresAt > now) {
    if (cached.value !== undefined) {
      return cached.value;
    }

    if (cached.promise) {
      return cached.promise;
    }
  }

  const pending = auth.api.getSession({ headers: requestHeaders });
  sessionCache.set(key, {
    expiresAt: now + SESSION_TTL_MS,
    promise: pending,
  });

  trimCacheIfNeeded();

  try {
    const value = await pending;
    sessionCache.set(key, {
      expiresAt: Date.now() + SESSION_TTL_MS,
      value,
    });
    return value;
  } catch (error) {
    sessionCache.delete(key);
    throw error;
  }
}
