export type AuthFlow = "login" | "signup";
export type AuthProvider = "google" | "linkedin" | "email";
export type AuthSurface = "login_page" | "overlay";

export interface PendingAuth {
  flow: AuthFlow;
  provider: AuthProvider;
  source: string;
  returnUrl: string;
  surface: AuthSurface;
  initiatedAt: number;
}

const PENDING_AUTH_KEY = "ftb_pending_auth";
const PENDING_AUTH_TTL_MS = 15 * 60 * 1000;

/**
 * Derives a human-readable login source.
 * Priority: explicit `source` query param > first segment of returnUrl > "home".
 * e.g. returnUrl "/internships" -> "internships", "/ungatekeep/saved" -> "ungatekeep".
 */
export function resolveAuthSource(
  explicitSource: string | null,
  returnUrl: string
): string {
  if (explicitSource) {
    return explicitSource;
  }

  if (!returnUrl || returnUrl === "/") {
    return "home";
  }

  const segment = returnUrl.split("/").filter(Boolean)[0];
  return segment ?? "home";
}

export function setPendingAuth(pending: PendingAuth): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PENDING_AUTH_KEY, JSON.stringify(pending));
  } catch {
    // sessionStorage unavailable (private mode etc.) — analytics only, ignore
  }
}

export function clearPendingAuth(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PENDING_AUTH_KEY);
  } catch {
    // ignore
  }
}

/**
 * Reads and removes the pending auth payload. Returns null if missing,
 * malformed, or older than the TTL (stale abandoned login attempts).
 */
export function consumePendingAuth(): PendingAuth | null {
  if (typeof window === "undefined") return null;

  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(PENDING_AUTH_KEY);
    window.sessionStorage.removeItem(PENDING_AUTH_KEY);
  } catch {
    return null;
  }

  if (!raw) return null;

  try {
    const pending = JSON.parse(raw) as PendingAuth;
    if (
      !pending ||
      typeof pending.initiatedAt !== "number" ||
      Date.now() - pending.initiatedAt > PENDING_AUTH_TTL_MS
    ) {
      return null;
    }
    return pending;
  } catch {
    return null;
  }
}
