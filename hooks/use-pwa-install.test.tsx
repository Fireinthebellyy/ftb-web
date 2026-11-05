import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { detectIosSafari, usePwaInstall } from "./use-pwa-install";
import {
  readPwaInstallState,
  resetPwaInstallMemoryState,
} from "@/lib/pwa-install-storage";

interface FakePromptEvent extends Event {
  prompt: ReturnType<typeof vi.fn>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const createPromptEvent = (outcome: "accepted" | "dismissed"): FakePromptEvent => {
  const event = new Event("beforeinstallprompt", { cancelable: true }) as FakePromptEvent;
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome });
  return event;
};

const setMatchMedia = (isStandalone: boolean) => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: isStandalone && query.includes("standalone"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
};

const setUserAgent = (ua: string) => {
  Object.defineProperty(window.navigator, "userAgent", { configurable: true, value: ua });
};

const IOS_SAFARI_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const IOS_CHROME_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0 Mobile/15E148 Safari/604.1";
const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

describe("usePwaInstall", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetPwaInstallMemoryState();
    setMatchMedia(false);
    setUserAgent(DESKTOP_UA);
    Object.defineProperty(window.navigator, "standalone", { configurable: true, value: undefined });
    Object.defineProperty(window.navigator, "getInstalledRelatedApps", {
      configurable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is mode 'none' on unsupported browsers", async () => {
    const { result } = renderHook(() => usePwaInstall());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.mode).toBe("none");
  });

  it("captures beforeinstallprompt, prevents default, and does not prompt until install()", async () => {
    const { result } = renderHook(() => usePwaInstall());
    await waitFor(() => expect(result.current.isReady).toBe(true));

    const event = createPromptEvent("accepted");
    act(() => {
      window.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(true);
    expect(result.current.mode).toBe("native");
    expect(event.prompt).not.toHaveBeenCalled();

    let outcome = "";
    await act(async () => {
      outcome = await result.current.install();
    });

    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(outcome).toBe("accepted");
    expect(readPwaInstallState().installed).toBe(true);
    expect(result.current.mode).toBe("none");
  });

  it("handles a dismissed prompt without marking installed", async () => {
    const { result } = renderHook(() => usePwaInstall());
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => {
      window.dispatchEvent(createPromptEvent("dismissed"));
    });

    let outcome = "";
    await act(async () => {
      outcome = await result.current.install();
    });

    expect(outcome).toBe("dismissed");
    expect(readPwaInstallState().installed).toBe(false);
  });

  it("persists installed permanently on appinstalled", async () => {
    const { result } = renderHook(() => usePwaInstall());
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });

    expect(readPwaInstallState().installed).toBe(true);
    expect(result.current.isInstalled).toBe(true);
  });

  it("detects standalone via display-mode", async () => {
    setMatchMedia(true);
    const { result } = renderHook(() => usePwaInstall());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.isStandalone).toBe(true);
    expect(result.current.mode).toBe("none");
  });

  it("detects standalone via navigator.standalone", async () => {
    Object.defineProperty(window.navigator, "standalone", { configurable: true, value: true });
    const { result } = renderHook(() => usePwaInstall());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.isStandalone).toBe(true);
  });

  it("marks installed when getInstalledRelatedApps returns an app", async () => {
    Object.defineProperty(window.navigator, "getInstalledRelatedApps", {
      configurable: true,
      value: vi.fn().mockResolvedValue([{ platform: "webapp" }]),
    });
    const { result } = renderHook(() => usePwaInstall());
    await waitFor(() => expect(result.current.isInstalled).toBe(true));
    expect(readPwaInstallState().installed).toBe(true);
  });

  it("ignores a throwing getInstalledRelatedApps", async () => {
    Object.defineProperty(window.navigator, "getInstalledRelatedApps", {
      configurable: true,
      value: vi.fn().mockRejectedValue(new Error("nope")),
    });
    const { result } = renderHook(() => usePwaInstall());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.isInstalled).toBe(false);
  });

  it("returns 'ios' mode on iOS Safari", async () => {
    setUserAgent(IOS_SAFARI_UA);
    const { result } = renderHook(() => usePwaInstall());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.mode).toBe("ios");
  });

  it("returns 'none' on iOS Chrome", async () => {
    setUserAgent(IOS_CHROME_UA);
    expect(detectIosSafari()).toBe(false);
    const { result } = renderHook(() => usePwaInstall());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.mode).toBe("none");
  });

  it("install() is unavailable without a captured prompt", async () => {
    const { result } = renderHook(() => usePwaInstall());
    await waitFor(() => expect(result.current.isReady).toBe(true));
    let outcome = "";
    await act(async () => {
      outcome = await result.current.install();
    });
    expect(outcome).toBe("unavailable");
  });
});

