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
 * Converts a string to title case while preserving admin's intentional casing and industry acronyms.
 */
export function toTitleCase(str: string | null | undefined): string {
  if (!str) return "";

  // If the string already contains uppercase letters, respect admin's exact casing choice
  if (/[A-Z]/.test(str)) {
    return str;
  }

  // Expanded list of words/acronyms that should always be fully capitalized when auto-formatting
  const acronyms = new Set([
    "HR", "HRBP", "SDET", "SRE", "HOD", "CEO", "CTO", "CFO", "COO", "CMO", "VP", "PR",
    "IT", "UI", "UX", "AI", "ML", "API", "PM", "QA", "SDE", "MERN", "MEAN", "LAMP", "PERN",
    "CA", "CPA", "CS", "BBA", "MBA", "BCA", "MCA", "BTECH", "MTECH",
    "SEO", "SMM", "GST", "AWS", "GCP", "AZURE", "IBM", "TCS", "CTS", "HCL", "WIPRO",
    "NPCI", "ISRO", "DRDO", "NASA", "FAANG", "MAANG", "MNC", "SaaS", "PaaS", "IaaS",
    "B2B", "B2C", "D2C", "SDK", "LLM", "NLP", "FTE", "PwC", "EY", "KPMG",
    "IIT", "NIT", "BITS", "IIIT"
  ]);

  const minorWords = new Set(["at", "in", "of", "and", "for", "the", "on", "to", "with", "by", "or", "a", "an"]);

  return str.replace(
    /[a-zA-Z0-9]+/g,
    (text, offset) => {
      const upper = text.toUpperCase();
      // Check against acronyms using the uppercase version
      if (acronyms.has(upper)) {
        return upper;
      }

      const lower = text.toLowerCase();
      // Keep minor prepositions/conjunctions lowercase if not at start of string
      if (offset > 0 && minorWords.has(lower)) {
        return lower;
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
  if (stipend === 0) return "Unpaid";
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
  try {
    // Avoid appending UTM params to LinkedIn URLs since LinkedIn flags unexpected external query params
    const isLinkedIn = /^(https?:\/\/)?(www\.)?linkedin\.com/i.test(url);
    if (isLinkedIn) {
      return url;
    }

    const hashIndex = url.indexOf("#");
    let baseUrl = url;
    let hash = "";
    if (hashIndex !== -1) {
      baseUrl = url.substring(0, hashIndex);
      hash = url.substring(hashIndex);
    }
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}utm_source=${source}${hash}`;
  } catch {
    return url;
  }
}

export function ensureAbsoluteUrl(url: string | null | undefined): string {
  if (!url || !url.trim()) return "";
  const trimmed = url.trim();
  if (/^(https?:\/\/)/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}
