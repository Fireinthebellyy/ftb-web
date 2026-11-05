export const PWA_INSTALL_STORAGE_KEY = "ftb:pwa-install:v1";

export interface PwaInstallState {
  installed: boolean;
  lastShownAt: string | null;
}

export type PwaInstallMode = "native" | "ios" | "none";

export interface ShouldShowContext {
  mode: PwaInstallMode;
  isStandalone: boolean;
  pathname: string | null | undefined;
  now?: Date;
}

const DEFAULT_STATE: PwaInstallState = { installed: false, lastShownAt: null };

const EXCLUDED_ROUTE_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/onboarding",
  "/checkout",
  "/toolkit/cohorts",
  "/toolkit/sprints",
  "/admin",
] as const;

// In-memory fallback used when localStorage is unavailable or throws.
let memoryState: PwaInstallState = { ...DEFAULT_STATE };

const normalizePath = (path: string): string =>
  path.length > 1 ? path.replace(/\/+$/, "") || "/" : path;

export function isExcludedRoute(pathname: string | null | undefined): boolean {
  if (!pathname) {
    return false;
  }
  const normalized = normalizePath(pathname);
  return EXCLUDED_ROUTE_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
}

/** Local calendar date as YYYY-MM-DD. */
export function getLocalDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseState(raw: string | null): PwaInstallState {
  if (!raw) {
    return { ...DEFAULT_STATE };
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return { ...DEFAULT_STATE };
    }
    const candidate = parsed as Partial<PwaInstallState>;
    const lastShownAt =
      typeof candidate.lastShownAt === "string" &&
      !Number.isNaN(new Date(candidate.lastShownAt).getTime())
        ? candidate.lastShownAt
        : null;
    return { installed: candidate.installed === true, lastShownAt };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function readPwaInstallState(): PwaInstallState {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return { ...memoryState };
    }
    const stored = parseState(window.localStorage.getItem(PWA_INSTALL_STORAGE_KEY));
    // Merge with memory so a failed earlier write is still honored this session.
    return {
      installed: stored.installed || memoryState.installed,
      lastShownAt: stored.lastShownAt ?? memoryState.lastShownAt,
    };
  } catch {
    return { ...memoryState };
  }
}

function writePwaInstallState(next: PwaInstallState): void {
  memoryState = { ...next };
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(PWA_INSTALL_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked or full; memory fallback already holds the state.
  }
}

export function markBannerShown(now: Date = new Date()): void {
  const current = readPwaInstallState();
  writePwaInstallState({ ...current, lastShownAt: now.toISOString() });
}

/** Permanent: never cleared by the app. */
export function markInstalled(): void {
  const current = readPwaInstallState();
  writePwaInstallState({ ...current, installed: true });
}

export function shouldShowBanner(
  state: PwaInstallState,
  context: ShouldShowContext
): boolean {
  if (state.installed) {
    return false;
  }
  if (context.isStandalone || context.mode === "none") {
    return false;
  }
  if (isExcludedRoute(context.pathname)) {
    return false;
  }
  if (state.lastShownAt) {
    const lastShown = new Date(state.lastShownAt);
    const now = context.now ?? new Date();
    if (getLocalDayKey(lastShown) === getLocalDayKey(now)) {
      return false;
    }
  }
  return true;
}

/** Test/dev helper: resets the in-memory fallback. */
export function resetPwaInstallMemoryState(): void {
  memoryState = { ...DEFAULT_STATE };
}

/** Dev helper: move lastShownAt back N days to simulate a later day. */
export function rewindLastShown(days: number): void {
  const current = readPwaInstallState();
  if (!current.lastShownAt) {
    return;
  }
  const rewound = new Date(current.lastShownAt);
  rewound.setDate(rewound.getDate() - days);
  writePwaInstallState({ ...current, lastShownAt: rewound.toISOString() });
}

export function resetPwaInstallState(): void {
  memoryState = { ...DEFAULT_STATE };
  try {
    window.localStorage.removeItem(PWA_INSTALL_STORAGE_KEY);
  } catch {
    // ignore
  }
}

