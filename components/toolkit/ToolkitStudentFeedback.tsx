"use client";

import { useEffect, useRef, useState } from "react";
import toolkitItems from "@/lib/toolkit-testimonials.json";

const ITEMS = toolkitItems as string[];
/** Runtime length from JSON (must match 9 entries) */
const COUNT = ITEMS.length;

export default function ToolkitStudentFeedback() {
  const [active, setActive] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (COUNT <= 1) return;

    intervalRef.current = window.setInterval(() => {
      setActive((prev) => (prev + 1) % COUNT);
    }, 3500);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const quote = ITEMS[active] ?? "";

  return (
    <div className="mt-4 rounded-lg border border-orange-100 bg-white px-4 py-4 sm:px-5">
      <p className="text-xs font-semibold tracking-wide text-orange-700 uppercase">
        What students feel about us
      </p>
      <p
        className="mt-2 text-sm leading-relaxed text-gray-700 sm:text-base"
        aria-live="polite"
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
