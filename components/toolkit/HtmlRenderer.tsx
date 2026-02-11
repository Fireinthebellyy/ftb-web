"use client";

import React, { useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";
import ProtectedContent from "./ProtectedContent";

interface HtmlRendererProps {
  content: string;
  className?: string;
  protected?: boolean;
  itemId?: string;
  onComplete?: (itemId: string) => void;
}

export default function HtmlRenderer({
  content,
  className,
  protected: isProtected = false,
  itemId,
  onComplete,
}: HtmlRendererProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const safeHtml = DOMPurify.sanitize(content, {
    USE_PROFILES: { html: true },
  });

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    hasCompletedRef.current = false;

    if (!itemId || !onCompleteRef.current || hasCompletedRef.current) return;

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
        onCompleteRef.current?.(itemId);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    const timeoutId = setTimeout(() => {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onCompleteRef.current?.(itemId);
      }
    }, timeThresholdMs);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [itemId]);

  const htmlContent = (
    <div
      ref={contentRef}
      className={cn(
        "max-w-none text-base text-gray-800",
        "[&_*]:leading-relaxed",
        "[&_p]:mb-3",
        "[&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:text-gray-900",
        "[&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-gray-900",
        "[&_a]:text-orange-600 [&_a]:underline-offset-2 hover:[&_a]:underline",
        "[&_strong]:font-semibold [&_strong]:text-gray-900",
        "[&_em]:italic",
        "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_blockquote]:border-l-4 [&_blockquote]:border-orange-500 [&_blockquote]:bg-orange-50 [&_blockquote]:px-4 [&_blockquote]:py-2 [&_blockquote]:text-gray-700 [&_blockquote]:italic",
        "[&_code]:rounded-md [&_code]:bg-orange-50 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:text-orange-600",
        "[&_pre]:mb-3 [&_pre]:rounded-lg [&_pre]:bg-gray-900 [&_pre]:p-4 [&_pre]:text-gray-100 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_img]:rounded-lg [&_img]:shadow-md",
        className
      )}
    >
      <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
    </div>
  );

  if (isProtected) {
    return <ProtectedContent>{htmlContent}</ProtectedContent>;
  }

  return htmlContent;
}
