"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import {
  PWA_INSTALL_STORAGE_KEY,
  isExcludedRoute,
  markBannerShown,
  readPwaInstallState,
  resetPwaInstallState,
  rewindLastShown,
  shouldShowBanner,
  type PwaInstallMode,
} from "@/lib/pwa-install-storage";

const SHOW_DELAY_MS = 4000;
const MAX_DIALOG_RETRIES = 5;

export interface UseInstallBannerResult {
  isVisible: boolean;
  mode: PwaInstallMode;
  /** Native: triggers the browser prompt, then hides. iOS: no-op (UI shows steps). */
  install: () => Promise<void>;
  dismiss: () => void;
}

const isDialogOpen = (): boolean =>
  typeof document !== "undefined" &&
  document.querySelector('[role="dialog"][data-state="open"]') !== null;

export function useInstallBanner(): UseInstallBannerResult {
  const pathname = usePathname();
  const { isReady, mode, isStandalone, install: promptInstall } = usePwaInstall();
  const [isVisible, setIsVisible] = useState(false);
  const hasShownThisMountRef = useRef(false);

  useEffect(() => {
    if (!isReady || hasShownThisMountRef.current) {
      return;
    }
    if (!shouldShowBanner(readPwaInstallState(), { mode, isStandalone, pathname })) {
      return;
    }

    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    const tryShow = () => {
      // Re-check at fire time: state may have changed (other tab, install, navigation).
      if (!shouldShowBanner(readPwaInstallState(), { mode, isStandalone, pathname })) {
        return;
      }
      if (isDialogOpen() && attempts < MAX_DIALOG_RETRIES) {
        attempts += 1;
        timer = setTimeout(tryShow, SHOW_DELAY_MS);
        return;
      }
      if (isDialogOpen()) {
        return;
      }
      hasShownThisMountRef.current = true;
      markBannerShown();
      setIsVisible(true);
      posthog.capture("pwa_install_banner_shown", { mode });
    };

    timer = setTimeout(tryShow, SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isReady, mode, isStandalone, pathname]);

  // Hide if the user installs (or dismisses) in another tab.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== PWA_INSTALL_STORAGE_KEY) {
        return;
      }
      if (readPwaInstallState().installed) {
        setIsVisible(false);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Dev-only time-travel helpers for manual QA.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      return;
    }
    const helpers = { rewindLastShown, reset: resetPwaInstallState };
    (window as unknown as { __ftbPwa?: typeof helpers }).__ftbPwa = helpers;
    return () => {
      delete (window as unknown as { __ftbPwa?: typeof helpers }).__ftbPwa;
    };
  }, []);

  const dismiss = useCallback(() => {
    // lastShownAt was already written when the banner appeared, so X counts as shown.
    setIsVisible(false);
    posthog.capture("pwa_install_banner_dismissed", { mode });
  }, [mode]);

  const install = useCallback(async () => {
    posthog.capture("pwa_install_banner_clicked", { mode });
    if (mode !== "native") {
      return;
    }
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      posthog.capture("pwa_install_accepted");
    } else if (outcome === "dismissed") {
      posthog.capture("pwa_install_declined");
    }
    setIsVisible(false);
  }, [mode, promptInstall]);

  return {
    isVisible: isVisible && !isExcludedRoute(pathname),
    mode,
    install,
    dismiss,
  };
}

