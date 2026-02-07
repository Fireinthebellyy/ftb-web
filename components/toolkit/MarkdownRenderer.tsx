"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import ProtectedContent from "./ProtectedContent";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  protected?: boolean;
  itemId?: string;
  onComplete?: (itemId: string) => void;
}

export default function MarkdownRenderer({
  content,
  className,
  protected: isProtected = false,
  itemId,
  onComplete,
}: MarkdownRendererProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const hasCompletedRef = useRef(false);
  const normalizedContent = useMemo(() => {
    if (!content) return "";
    if (typeof window === "undefined") return content;
    if (!content.includes("&lt;") && !content.includes("&gt;")) {
      return content;
    }

    const textarea = document.createElement("textarea");
    textarea.innerHTML = content;
    return textarea.value;
  }, [content]);

  useEffect(() => {
    if (!itemId || !onComplete || hasCompletedRef.current) return;

    const timeThresholdMs = 50000 + Math.random() * 10000;
    const scrollThreshold = 0.95;

    const handleScroll = () => {
      if (!contentRef.current || hasCompletedRef.current) return;

      const element = contentRef.current;
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const scrollPercentage =
        (windowHeight - rect.top) / (rect.height + windowHeight);

      if (scrollPercentage >= scrollThreshold) {
        hasCompletedRef.current = true;
        onComplete(itemId);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    const timeoutId = setTimeout(() => {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onComplete(itemId);
      }
    }, timeThresholdMs);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [itemId, onComplete]);

  const markdownContent = (
    <div
      ref={contentRef}
      className={cn(
        "prose prose-gray prose-lg max-w-none",
        "prose-headings:font-semibold prose-headings:text-gray-900",
        "prose-p:text-gray-700 prose-p:leading-relaxed",
        "prose-a:text-orange-600 prose-a:no-underline hover:prose-a:underline",
        "prose-strong:text-gray-900 prose-strong:font-semibold",
        "prose-code:text-orange-600 prose-code:bg-orange-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm",
        "prose-pre:bg-gray-900 prose-pre:text-gray-100",
        "prose-blockquote:border-l-4 prose-blockquote:border-orange-500 prose-blockquote:bg-orange-50 prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:italic prose-blockquote:text-gray-700",
        "prose-ul:list-disc prose-ul:marker:text-orange-500",
        "prose-ol:list-decimal prose-ol:marker:text-orange-500",
        "prose-img:rounded-lg prose-img:shadow-md",
        className
      )}
    >
      <div dangerouslySetInnerHTML={{ __html: normalizedContent }} />
    </div>
  );

  if (isProtected) {
    return <ProtectedContent>{markdownContent}</ProtectedContent>;
  }

  return markdownContent;
}
