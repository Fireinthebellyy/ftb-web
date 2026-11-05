"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  markInstalled,
  readPwaInstallState,
  type PwaInstallMode,
} from "@/lib/pwa-install-storage";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform?: string }>;
}

interface NavigatorWithInstallApis extends Navigator {
  standalone?: boolean;
  getInstalledRelatedApps?: () => Promise<unknown[]>;
}

export type PwaInstallOutcome = "accepted" | "dismissed" | "unavailable";

export interface UsePwaInstallResult {
  /** False until client-side detection has run (avoids SSR/hydration flashes). */
  isReady: boolean;
  mode: PwaInstallMode;
  isStandalone: boolean;
  isInstalled: boolean;
  /** Must be called from a user gesture (click). Only the native mode prompts. */
  install: () => Promise<PwaInstallOutcome>;
}

export function detectStandalone(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const nav = window.navigator as NavigatorWithInstallApis;
  const displayModeStandalone =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  return displayModeStandalone || nav.standalone === true;
}

/** True only for iOS Safari proper (not Chrome/Firefox/Edge on iOS or in-app webviews). */
export function detectIosSafari(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const ua = window.navigator.userAgent;
  const isIosDevice =
    /iPhone|iPad|iPod/.test(ua) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  if (!isIosDevice) {
    return false;
  }
  const isThirdPartyBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|GSA|FBAN|FBAV|Instagram|LinkedIn|Line\//.test(ua);
  return /Safari/.test(ua) && !isThirdPartyBrowser;
}

export function usePwaInstall(): UsePwaInstallResult {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasNativePrompt, setHasNativePrompt] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);

  useEffect(() => {
    const standalone = detectStandalone();
    setIsStandalone(standalone);
    setIsIosSafari(detectIosSafari());
    setIsInstalled(readPwaInstallState().installed || standalone);
    setIsReady(true);

    const handleBeforeInstallPrompt = (event: Event) => {
      // Suppress the mini-infobar; we prompt only when the user taps Install.
      event.preventDefault();
      deferredPromptRef.current = event as BeforeInstallPromptEvent;
      setHasNativePrompt(true);
    };

    const handleAppInstalled = () => {
      markInstalled();
      deferredPromptRef.current = null;
      setHasNativePrompt(false);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    const nav = window.navigator as NavigatorWithInstallApis;
    let isCancelled = false;
    if (typeof nav.getInstalledRelatedApps === "function") {
      nav
        .getInstalledRelatedApps()
        .then((apps) => {
          if (!isCancelled && Array.isArray(apps) && apps.length > 0) {
            markInstalled();
            setIsInstalled(true);
          }
        })
        .catch(() => {
          // Unsupported or blocked; best-effort signal only.
        });
    }

    return () => {
      isCancelled = true;
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<PwaInstallOutcome> => {
    const deferredPrompt = deferredPromptRef.current;
    if (!deferredPrompt) {
      return "unavailable";
    }
    // The event is single-use regardless of the outcome.
    deferredPromptRef.current = null;
    setHasNativePrompt(false);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        markInstalled();
        setIsInstalled(true);
        return "accepted";
      }
      return "dismissed";
    } catch {
      return "unavailable";
    }
  }, []);

  let mode: PwaInstallMode = "none";
  if (!isStandalone && !isInstalled) {
    if (hasNativePrompt) {
      mode = "native";
    } else if (isIosSafari) {
      mode = "ios";
    }
  }

  return { isReady, mode, isStandalone, isInstalled, install };
}

