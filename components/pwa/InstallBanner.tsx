"use client";

import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallBanner } from "@/hooks/use-install-banner";
import { cn } from "@/lib/utils";

const APP_NAME = "FTB";

/** Mirrors the routes where BottomNav renders nothing. */
const isBottomNavHidden = (pathname: string | null): boolean => {
  if (!pathname) {
    return false;
  }
  const normalized = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  return (
    normalized === "/onboarding" ||
    normalized.startsWith("/intern/") ||
    normalized.startsWith("/toolkit/cohorts/") ||
    normalized.startsWith("/toolkit/sprints/")
  );
};

export default function InstallBanner() {
  const pathname = usePathname();
  const { isVisible, mode, install, dismiss } = useInstallBanner();
  const [isShowingIosSteps, setIsShowingIosSteps] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const isRendered = isVisible && mode !== "none";
  const hasBottomNav = !isBottomNavHidden(pathname);

  const handleInstallClick = () => {
    if (mode === "ios") {
      setIsShowingIosSteps(true);
      void install();
      return;
    }
    void install();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      dismiss();
    }
  };

  return (
    <AnimatePresence>
      {isRendered && (
        <motion.section
          role="region"
          aria-label="Install app"
          onKeyDown={handleKeyDown}
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={
            shouldReduceMotion
              ? { duration: 0.15 }
              : { type: "spring", stiffness: 260, damping: 20 }
          }
          className={cn(
            "fixed z-[45] mx-auto max-w-md rounded-2xl border border-neutral-200 bg-white p-3 shadow-lg",
            "right-[max(0.75rem,env(safe-area-inset-right))] left-[max(0.75rem,env(safe-area-inset-left))]",
            hasBottomNav
              ? "bottom-[calc(env(safe-area-inset-bottom)+68px)]"
              : "bottom-[calc(env(safe-area-inset-bottom)+12px)]",
            "md:bottom-4"
          )}
        >
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss install banner"
            className="absolute top-2 right-2 rounded-full p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 focus:ring-2 focus:ring-orange-500 focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3 pr-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black">
              <Image
                src="/icons/icon-192.png"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-primary text-[10px] font-bold tracking-wide">
                SHORTCUT · NO APP STORE
              </p>
              <p className="truncate text-sm font-bold text-neutral-900">
                Install {APP_NAME}
              </p>
              <p
                className="text-xs text-neutral-600"
                aria-live="polite"
              >
                {isShowingIosSteps ? (
                  <span className="inline-flex flex-wrap items-center gap-1">
                    Tap <Share className="inline h-3.5 w-3.5" aria-hidden />
                    <strong>Share</strong> →{" "}
                    <Plus className="inline h-3.5 w-3.5" aria-hidden />
                    <strong>Add to Home Screen</strong>
                  </span>
                ) : (
                  "Add to the home screen for one-tap access : Internships, Tracker & Opportunities"
                )}
              </p>
            </div>
            {!isShowingIosSteps && (
              <Button
                type="button"
                size="sm"
                onClick={handleInstallClick}
                className="h-8 shrink-0 cursor-pointer rounded-lg px-3 text-xs font-bold active:scale-95"
              >
                Install
              </Button>
            )}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

