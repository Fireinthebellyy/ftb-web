import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | Date) {
  const now = dayjs();
  const target = dayjs(input);
  const diffDays = now.diff(target, "day");

  if (diffDays < 3) {
    return target.fromNow();
  }
  return target.format("D MMM");
}

/**
 * Strip HTML tags and decode HTML entities from a string
 * Returns plain text suitable for previews
 */
export function stripHtml(input: string | null | undefined): string {
  if (!input) return "";

  return input
    .replace(/<[^>]*>/g, " ") // Remove HTML tags
    .replace(/&nbsp;/gi, " ") // Replace &nbsp; with space
    .replace(/&amp;/gi, "&") // Handle common HTML entities
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#[0-9]+;/gi, (match) => {
      // Handle numeric entities
      const code = parseInt(match.slice(2, -1), 10);
      return String.fromCharCode(code);
    })
    .replace(/&[a-z]+;/gi, " ") // Remove other entities
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
}
