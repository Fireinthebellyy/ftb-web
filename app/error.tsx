"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: {
        action: "app.error.boundary",
      },
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center">
      <h2 className="text-4xl font-bold tracking-tight">
        Something went wrong!
      </h2>
      <p className="text-muted-foreground max-w-[500px]">
        We apologize for the inconvenience. An unexpected error has occurred.
      </p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
