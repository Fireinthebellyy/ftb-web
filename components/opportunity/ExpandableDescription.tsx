"use client";

import { useRef, useState, useEffect } from "react";

const CLAMP_LINES = 4;
const LINE_HEIGHT_PX = 22;
const MAX_HEIGHT = CLAMP_LINES * LINE_HEIGHT_PX;

interface ExpandableDescriptionProps {
  text: string;
  isCardExpanded?: boolean;
}

export function ExpandableDescription({
  text,
  isCardExpanded = true,
}: ExpandableDescriptionProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [clamped, setClamped] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (ref.current) {
      setClamped(ref.current.scrollHeight > MAX_HEIGHT);
    }
  }, [text]);

  if (!isCardExpanded) {
    return (
      <div className="mb-2 text-sm leading-relaxed text-gray-700">
        <p className="line-clamp-1 text-ellipsis">{text}</p>
      </div>
    );
  }

  return (
    <div className="mb-3 text-sm leading-relaxed text-gray-700">
      <p ref={ref} className={expanded ? "" : "line-clamp-4 text-ellipsis"}>
        {text}
      </p>
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
