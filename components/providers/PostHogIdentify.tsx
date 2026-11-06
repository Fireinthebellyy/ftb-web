"use client";

import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import { useSession } from "@/hooks/use-session";
import { consumePendingAuth } from "@/lib/auth-analytics";

export function PostHogIdentify() {
  const { data: session, isLoading } = useSession();
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog || isLoading) return;

    if (session?.user) {
      posthog.identify(session.user.id, {
        email: session.user.email,
        name: session.user.name,
        createdAt: session.user.createdAt.toISOString(),
      });

      // If the user just completed a social sign-in/sign-up (full-page
      // redirect), the pending payload tells us where they started from.
      const pending = consumePendingAuth();
      if (pending) {
        posthog.capture(
          pending.flow === "signup" ? "user_signed_up" : "user_signed_in",
          {
            auth_provider: pending.provider,
            login_source: pending.source,
            return_url: pending.returnUrl,
            auth_surface: pending.surface,
          }
        );
      }
    } else if (session === null) {
      // Only reset when session is explicitly null (confirmed signed-out),
      // not while it's still undefined (query pending).
      posthog.reset();
    }
  }, [session, isLoading, posthog]);

  return null;
}
