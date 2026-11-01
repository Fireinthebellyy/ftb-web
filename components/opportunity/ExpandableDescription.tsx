"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import DOMPurify from "dompurify";
import posthog from "posthog-js";
import { cn, stripHtml } from "@/lib/utils";

const CLAMP_LINES = 4;

interface ExpandableDescriptionProps {
  text: string;
  isCardExpanded?: boolean;
  contextId?: string;
  contextType?: string;
}

export function ExpandableDescription({
  text,
  isCardExpanded = true,
  contextId,
  contextType = "opportunity",
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
        .replace(/\u00a0/g, " ")
        .replace(/-/g, "\u2011");
    });

    return container.innerHTML;
  }, [text]);

  const plainTextPreview = useMemo(() => stripHtml(text), [text]);

  useEffect(() => {
    if (!ref.current || !isCardExpanded) {
      setClamped(false);
      return;
    }

    const element = ref.current;

    const previousClassName = element.className;

    element.classList.remove("line-clamp-4", "text-ellipsis");

    const fullHeight = element.scrollHeight;

    element.className = previousClassName;

    const computedStyle = window.getComputedStyle(element);
    const lineHeight = parseFloat(computedStyle.lineHeight);
    const maxHeight = !isNaN(lineHeight)
      ? lineHeight * CLAMP_LINES
      : 16 * CLAMP_LINES;

  setClamped(fullHeight > maxHeight + 1);
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
          "w-full min-w-0 overflow-hidden whitespace-normal break-normal",
          expanded ? "" : "line-clamp-4 text-ellipsis",
          "[&_ol]:ml-4 [&_ol]:list-decimal [&_p]:mb-1 last:[&_p]:mb-0 [&_ul]:ml-4 [&_ul]:list-disc",
          "[&_*]:whitespace-normal"
        )}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
      {clamped && (
        <button
          type="button"
          onClick={() => {
            if (!expanded && contextId) {
              posthog.capture(`${contextType}_read_more_clicked`, {
                [`${contextType}_id`]: contextId,
              });
            }
            setExpanded((prev) => !prev);
          }}
          className="mt-0.5 text-xs font-medium text-primary hover:text-primary"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
