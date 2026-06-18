"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import toolkitItems from "@/lib/toolkit-testimonials.json";

const ITEMS = toolkitItems as string[];
/** Runtime length from JSON (must match 9 entries) */
const COUNT = ITEMS.length;

const ROTATE_MS = 3500;

export default function ToolkitStudentFeedback() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (COUNT <= 1) return;

    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (paused) {
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setActive((prev) => (prev + 1) % COUNT);
    }, ROTATE_MS);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [paused]);

  const quote = ITEMS[active] ?? "";

  return (
    <div className="mt-4 rounded-lg border border-orange-100 bg-white px-4 py-4 sm:px-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide text-orange-700 uppercase">
          What students feel about us
        </p>
        {COUNT > 1 ? (
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground inline-flex shrink-0 rounded-md p-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            aria-label={
              paused
                ? "Resume automatically rotating testimonials"
                : "Pause automatically rotating testimonials"
            }
          >
            {paused ? (
              <Play className="size-4" strokeWidth={2} aria-hidden />
            ) : (
              <Pause className="size-4" strokeWidth={2} aria-hidden />
            )}
          </button>
        ) : null}
      </div>
      <p
        className="mt-2 text-sm leading-relaxed text-gray-700 sm:text-base"
        {...(paused ? { "aria-live": "polite" as const } : { "aria-live": "off" as const })}
      >
        &ldquo;{quote}&rdquo;
      </p>
      <div className="mt-3 flex max-w-full flex-wrap items-center justify-center gap-1.5">
        {ITEMS.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Testimonial ${index + 1} of ${COUNT}`}
            aria-current={index === active ? "true" : undefined}
            className={`h-1.5 shrink-0 rounded-full transition-all ${
              index === active
                ? "w-4 bg-orange-500"
                : "w-1.5 bg-orange-200 hover:bg-orange-300"
            }`}
            onClick={() => setActive(index)}
          />
        ))}
      </div>
    </div>
  );
}
