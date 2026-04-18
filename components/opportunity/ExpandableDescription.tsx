"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import DOMPurify from "dompurify";
import { cn, stripHtml } from "@/lib/utils";

const CLAMP_LINES = 4;

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

  const safeHtml = useMemo(() => {
    const sanitizedHtml = DOMPurify.sanitize(text);

    if (typeof window === "undefined") {
      return sanitizedHtml;
    }

    const parser = new DOMParser();
    const documentFragment = parser.parseFromString(
      `<div>${sanitizedHtml}</div>`,
      "text/html"
    );
    const container = documentFragment.body.firstElementChild;

    if (!container) {
      return sanitizedHtml;
    }

    const walker = documentFragment.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    let currentNode = walker.nextNode();

    while (currentNode) {
      textNodes.push(currentNode as Text);
      currentNode = walker.nextNode();
    }

    textNodes.forEach((node) => {
      node.nodeValue = (node.nodeValue ?? "")
        .replace(/-/g, "\u2011")
        .replace(/\s*\|\s*/g, ";");
    });

  }, [text]);

  const plainTextPreview = useMemo(() => stripHtml(text), [text]);

  useEffect(() => {
    if (ref.current && isCardExpanded) {
      const computedStyle = window.getComputedStyle(ref.current);
      const lineHeight = parseFloat(computedStyle.lineHeight);
      const maxHeight = !isNaN(lineHeight) ? lineHeight * CLAMP_LINES : 16 * CLAMP_LINES;
      setClamped(ref.current.scrollHeight > maxHeight);
    } else {
      setClamped(false);
    }
  }, [text, isCardExpanded]);

  if (!isCardExpanded) {
    return (
      <div className="mb-2 text-sm leading-[1.26] text-gray-700">
        <p className="line-clamp-1 text-ellipsis">{plainTextPreview}</p>
      </div>
    );
  }

  return (
    <div className="mb-3 w-full min-w-0 text-sm leading-[1.26] text-gray-700">
      <div
        ref={ref}
        className={cn(
          "w-full break-words",
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
