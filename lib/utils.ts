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

/**
 * Converts a string to title case while preserving capitalization for common industry acronyms.
 */
export function toTitleCase(str: string | null | undefined): string {
  if (!str) return "";

  // Words that should always be fully capitalized
  const acronyms = new Set([
    "HR", "CEO", "CTO", "CFO", "COO", "CMO", "VP", "PR",
    "IT", "UI", "UX", "AI", "ML", "API", "PM", "QA", "SDE",
    "CA", "CPA", "CS", "BBA", "MBA", "BCA", "MCA", "BTECH", "MTECH",
    "SEO", "SMM", "GST"
  ]);

  return str.replace(
    /[a-zA-Z0-9]+/g,
    (text) => {
      // Extract pure alphabetic part for mixed-case detection
      const cleanText = text.replace(/[^a-zA-Z]/g, "");
      const hasUpper = /[A-Z]/.test(cleanText);
      const hasLower = /[a-z]/.test(cleanText);

      // Preserve mixed-case tokens (e.g., iPhone, FedEx)
      if (hasUpper && hasLower) {
        return text;
      }

      // Check against acronyms using the uppercase version
      if (acronyms.has(text.toUpperCase())) {
        return text.toUpperCase();
      }

      return text.charAt(0).toUpperCase() + text.substring(1).toLowerCase();
    }
  );
}

/**
 * Format stipend amount with currency and period
 */
export function formatSalary(stipend: number | null | undefined): string {
  if (stipend === null || stipend === undefined) return "Unpaid / Not disclosed";
  return `${stipend.toLocaleString()} / mo`;
}

/**
 * Format date to a readable long format
 */
export function formatDateLong(dateString: string | null | undefined): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function addUtmParams(url: string, source: string): string {
  if (!url) return "";
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}utm_source=${source}`;
}
