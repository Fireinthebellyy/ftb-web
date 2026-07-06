"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { useSession } from "@/hooks/use-session";

export function PostHogIdentify() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      posthog.identify(session.user.id, {
        email: session.user.email,
        name: session.user.name,
        createdAt: session.user.createdAt.toISOString(),
      });
    } else {
      posthog.reset();
    }
  }, [session?.user?.id]);

  return null;
}
