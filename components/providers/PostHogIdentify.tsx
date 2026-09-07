"use client";

import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import { useSession } from "@/hooks/use-session";

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
    } else if (session === null) {
      // Only reset when session is explicitly null (confirmed signed-out),
      // not while it's still undefined (query pending).
      posthog.reset();
    }
  }, [session, isLoading, posthog]);

  return null;
}
