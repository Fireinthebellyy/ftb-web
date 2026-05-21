"use client";

import React from "react";

interface LinkifyTextProps {
  text?: string | null;
}

export function LinkifyText({ text }: LinkifyTextProps) {
  if (!text) return null;

  // Regex matching standard URLs starting with http://, https://, or www., excluding trailing punctuation
  const urlRegex = /(https?:\/\/[^\s]+?|www\.[^\s]+?)(?=[.,;:)\]!?]*(?:\s|$))/g;

  const parts = text.split(urlRegex);

  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        const isUrl =
          part.startsWith("http://") ||
          part.startsWith("https://") ||
          part.startsWith("www.");

        if (isUrl) {
          const href = part.startsWith("www.") ? `https://${part}` : part;
          return (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#ec5b13] hover:text-[#d44d0c] font-semibold underline underline-offset-2 break-all transition-colors active:opacity-80"
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </span>
  );
}
