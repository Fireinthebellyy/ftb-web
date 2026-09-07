"use client";

import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import { useSession } from "@/hooks/use-session";

export function PostHogIdentify() {
  const { data: session } = useSession();
  const posthog = usePostHog();

  useEffect(() => {
    if (!posthog) return;

    if (session?.user) {
      posthog.identify(session.user.id, {
        email: session.user.email,
        name: session.user.name,
        createdAt: session.user.createdAt.toISOString(),
      });
    } else {
      // Reset when logged out so anonymous sessions don't
      // bleed into a previous user's profile
      posthog.reset();
    }
  }, [session?.user, posthog]);

  return null;
}
