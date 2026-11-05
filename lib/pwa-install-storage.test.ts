import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PWA_INSTALL_STORAGE_KEY,
  getLocalDayKey,
  isExcludedRoute,
  markBannerShown,
  markInstalled,
  readPwaInstallState,
  resetPwaInstallMemoryState,
  rewindLastShown,
  shouldShowBanner,
  type PwaInstallState,
} from "./pwa-install-storage";

const fresh: PwaInstallState = { installed: false, lastShownAt: null };
const baseCtx = {
  mode: "native" as const,
  isStandalone: false,
  pathname: "/opportunities",
};

describe("pwa-install-storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetPwaInstallMemoryState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("shouldShowBanner", () => {
    it("shows on first visit", () => {
      expect(shouldShowBanner(fresh, baseCtx)).toBe(true);
    });

    it("hides when already shown on the same local day", () => {
      const now = new Date(2026, 10, 2, 9, 0, 0);
      const state = { installed: false, lastShownAt: new Date(2026, 10, 2, 1, 0, 0).toISOString() };
      expect(shouldShowBanner(state, { ...baseCtx, now })).toBe(false);
    });

    it("shows again the next calendar day, even less than 24h later", () => {
      const state = { installed: false, lastShownAt: new Date(2026, 10, 2, 23, 59, 0).toISOString() };
      const now = new Date(2026, 10, 3, 0, 1, 0);
      expect(shouldShowBanner(state, { ...baseCtx, now })).toBe(true);
    });

    it("never shows once installed", () => {
      expect(shouldShowBanner({ installed: true, lastShownAt: null }, baseCtx)).toBe(false);
    });

    it("never shows in standalone mode", () => {
      expect(shouldShowBanner(fresh, { ...baseCtx, isStandalone: true })).toBe(false);
    });

    it("never shows for unsupported browsers", () => {
      expect(shouldShowBanner(fresh, { ...baseCtx, mode: "none" })).toBe(false);
    });

    it("shows for iOS mode", () => {
      expect(shouldShowBanner(fresh, { ...baseCtx, mode: "ios" })).toBe(true);
    });
  });

  describe("isExcludedRoute", () => {
    it.each([
      "/login",
      "/signup",
      "/forgot-password",
      "/reset-password",
      "/onboarding",
      "/checkout",
      "/checkout/",
      "/checkout/success",
      "/toolkit/cohorts/abc",
      "/toolkit/sprints/abc",
      "/admin",
      "/admin/users",
    ])("excludes %s", (path) => {
      expect(isExcludedRoute(path)).toBe(true);
    });

    it.each(["/", "/opportunities", "/intern", "/toolkit", "/tracker", "/loginfoo"])(
      "allows %s",
      (path) => {
        expect(isExcludedRoute(path)).toBe(false);
      }
    );

    it("allows null pathname", () => {
      expect(isExcludedRoute(null)).toBe(false);
    });
  });

  describe("persistence", () => {
    it("records lastShownAt and reads it back", () => {
      markBannerShown(new Date(2026, 10, 2, 10, 0, 0));
      const state = readPwaInstallState();
      expect(state.lastShownAt).not.toBeNull();
      expect(getLocalDayKey(new Date(state.lastShownAt as string))).toBe("2026-11-02");
    });

    it("persists installed permanently and keeps lastShownAt", () => {
      markBannerShown();
      markInstalled();
      const state = readPwaInstallState();
      expect(state.installed).toBe(true);
      expect(state.lastShownAt).not.toBeNull();
    });

    it("treats corrupt JSON as empty state", () => {
      window.localStorage.setItem(PWA_INSTALL_STORAGE_KEY, "{not json");
      expect(readPwaInstallState()).toEqual(fresh);
    });

    it("ignores invalid lastShownAt values", () => {
      window.localStorage.setItem(
        PWA_INSTALL_STORAGE_KEY,
        JSON.stringify({ installed: false, lastShownAt: "garbage" })
      );
      expect(readPwaInstallState().lastShownAt).toBeNull();
    });

    it("falls back to memory when localStorage throws", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("blocked");
      });
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("blocked");
      });
      expect(() => markBannerShown()).not.toThrow();
      const state = readPwaInstallState();
      expect(state.lastShownAt).not.toBeNull();
      expect(shouldShowBanner(state, baseCtx)).toBe(false);
    });

    it("rewindLastShown simulates a later day", () => {
      markBannerShown(new Date());
      expect(shouldShowBanner(readPwaInstallState(), baseCtx)).toBe(false);
      rewindLastShown(1);
      expect(shouldShowBanner(readPwaInstallState(), baseCtx)).toBe(true);
    });
  });
});

