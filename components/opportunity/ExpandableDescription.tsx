"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import DOMPurify from "dompurify";
import { cn, stripHtml } from "@/lib/utils";

const CLAMP_LINES = 4;
const LINE_HEIGHT_PX = 16;
const MAX_HEIGHT = CLAMP_LINES * LINE_HEIGHT_PX;

interface ExpandableDescriptionProps {
  text: string;
  isCardExpanded?: boolean;
}

export function ExpandableDescription({
  text,
  isCardExpanded = true,
}: ExpandableDescriptionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [clamped, setClamped] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const safeHtml = useMemo(() => DOMPurify.sanitize(text), [text]);
  const plainTextPreview = useMemo(() => stripHtml(text), [text]);

  useEffect(() => {
    if (ref.current && isCardExpanded) {
      setClamped(ref.current.scrollHeight > MAX_HEIGHT);
    } else {
      setClamped(false);
    }
  }, [text, isCardExpanded]);

  if (!isCardExpanded) {
    return (
      <div className="mb-2 text-sm leading-[1.2] text-gray-700">
        <p className="line-clamp-1 text-ellipsis">{plainTextPreview}</p>
      </div>
    );
  }

  return (
    <div className="mb-3 text-sm leading-[1.2] text-gray-700">
      <div
        ref={ref}
        className={cn(
          expanded ? "" : "line-clamp-4 text-ellipsis",
          "[&_ol]:ml-4 [&_ol]:list-decimal [&_p]:mb-1 last:[&_p]:mb-0 [&_ul]:ml-4 [&_ul]:list-disc",
          "[&_*]:break-words [&_*]:whitespace-normal"
        )}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
      {clamped && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-0.5 text-xs font-medium text-primary hover:text-primary"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
