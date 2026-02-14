import { db } from "@/lib/db";
import { internships, user } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { isValid, parse } from "date-fns";
import { z } from "zod";

export const canonicalTypes = ["remote", "hybrid", "onsite"] as const;
export const canonicalTimings = ["full_time", "part_time"] as const;

export const internshipIngestRecordSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be at most 100 characters"),
  hiringOrganization: z
    .string()
    .min(1, "Hiring organization is required")
    .max(120, "Hiring organization must be at most 120 characters"),
  link: z
    .string()
    .url("Valid application link is required")
    .max(2048, "Application link must be at most 2048 characters"),
  description: z
    .string()
    .max(2000, "Description must be at most 2000 characters")
    .optional()
    .nullable(),
  type: z
    .string()
    .max(32, "Type must be at most 32 characters")
    .optional()
    .nullable(),
  timing: z
    .string()
    .max(32, "Timing must be at most 32 characters")
    .optional()
    .nullable(),
  stipend: z
    .union([z.number().min(0), z.string()])
    .optional()
    .nullable(),
  duration: z
    .string()
    .max(100, "Duration must be at most 100 characters")
    .optional()
    .nullable(),
  experience: z
    .string()
    .max(100, "Experience must be at most 100 characters")
    .optional()
    .nullable(),
  location: z
    .string()
    .max(160, "Location must be at most 160 characters")
    .optional()
    .nullable(),
  deadline: z
    .string()
    .max(64, "Deadline must be at most 64 characters")
    .optional()
    .nullable(),
  tags: z
    .union([
      z
        .array(z.string().max(50, "Each tag must be at most 50 characters"))
        .max(30),
      z.string().max(1000, "Tags must be at most 1000 characters"),
    ])
    .optional()
    .nullable(),
  hiringManager: z
    .string()
    .max(100, "Hiring manager must be at most 100 characters")
    .optional()
    .nullable(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
  rawText: z
    .string()
    .max(20000, "Raw text must be at most 20000 characters")
    .optional()
    .nullable(),
});

export const internshipIngestBatchSchema = z
  .array(internshipIngestRecordSchema)
  .min(1)
  .max(500);

export type InternshipIngestRecord = z.infer<
  typeof internshipIngestRecordSchema
>;

function normalizeType(value?: string | null, fallbackText?: string | null) {
  const normalized = (value ?? "").trim().toLowerCase();
  if (
    ["work-from-home", "work_from_home", "wfh", "remote"].includes(normalized)
  ) {
    return "remote";
  }
  if (["in-office", "in_office", "onsite", "on-site"].includes(normalized)) {
    return "onsite";
  }
  if (canonicalTypes.includes(normalized as (typeof canonicalTypes)[number])) {
    return normalized as (typeof canonicalTypes)[number];
  }

  const haystack = (fallbackText ?? "").toLowerCase();
  if (/\b(remote|wfh|work\s*from\s*home)\b/.test(haystack)) {
    return "remote";
  }
  if (/\b(on\s*-?\s*site|in\s*-?\s*office|office)\b/.test(haystack)) {
    return "onsite";
  }
  if (/\bhybrid\b/.test(haystack)) {
    return "hybrid";
  }

  return null;
}

function normalizeTiming(value?: string | null, fallbackText?: string | null) {
  const normalized = (value ?? "").trim().toLowerCase();
  if (["full-time", "full_time", "full time"].includes(normalized)) {
    return "full_time";
  }
  if (
    [
      "part-time",
      "part_time",
      "part time",
      "shift-based",
      "shift_based",
    ].includes(normalized)
  ) {
    return "part_time";
  }
  if (
    canonicalTimings.includes(normalized as (typeof canonicalTimings)[number])
  ) {
    return normalized as (typeof canonicalTimings)[number];
  }

  const haystack = (fallbackText ?? "").toLowerCase();
  if (/\bfull\s*-?\s*time\b/.test(haystack)) {
    return "full_time";
  }
  if (
    /\bpart\s*-?\s*time\b/.test(haystack) ||
    /\bshift\s*-?\s*based\b/.test(haystack)
  ) {
    return "part_time";
  }

  return null;
}

function normalizeTags(tags: string[] | string | null | undefined) {
  if (!tags) {
    return [];
  }

  if (Array.isArray(tags)) {
    return tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean);
  }

  return tags
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function parseStipend(
  stipend: string | number | null | undefined,
  fallbackText?: string | null
) {
  if (typeof stipend === "number" && Number.isFinite(stipend)) {
    return stipend;
  }

  const fromValue = typeof stipend === "string" ? stipend : "";
  const source = `${fromValue} ${fallbackText ?? ""}`;
  const match = source.match(
    /(?:₹|rs\.?|inr)?\s*([0-9][0-9,]*)\s*(?:\/?\s*month|pm|per\s*month)?/i
  );

  if (!match) {
    return null;
  }

  const parsed = Number.parseInt(match[1].replace(/,/g, ""), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseDeadline(
  deadline: string | null | undefined,
  fallbackText?: string | null
) {
  const raw = (deadline ?? "").trim();
  if (raw) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  }

  const text = fallbackText ?? "";
  const monthDateYear = text.match(
    /\b(?:deadline|apply\s*by|last\s*date)[:\s-]*([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})\b/i
  );
  if (monthDateYear?.[1]) {
    const parsed = new Date(monthDateYear[1]);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  }

  const slashDate = text.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{4})\b/);
  if (slashDate?.[1]) {
    const normalizedSlashDate = slashDate[1].replace(/-/g, "/");
    const [first, second, year] = normalizedSlashDate
      .split("/")
      .map((part) => Number.parseInt(part, 10));

    if (
      Number.isFinite(first) &&
      Number.isFinite(second) &&
      Number.isFinite(year)
    ) {
      const mmdd = parse(normalizedSlashDate, "MM/dd/yyyy", new Date());
      if (
        isValid(mmdd) &&
        mmdd.getFullYear() === year &&
        mmdd.getMonth() + 1 === first &&
        mmdd.getDate() === second
      ) {
        return mmdd.toISOString().split("T")[0];
      }

      const ddmm = parse(normalizedSlashDate, "dd/MM/yyyy", new Date());
      if (
        isValid(ddmm) &&
        ddmm.getFullYear() === year &&
        ddmm.getMonth() + 1 === second &&
        ddmm.getDate() === first
      ) {
        return ddmm.toISOString().split("T")[0];
      }
    }
  }

  return null;
}

export async function getIngestUserId() {
  const ingestUserId = process.env.INTERNSHIP_INGEST_USER_ID;

  if (!ingestUserId) {
    throw new Error("INTERNSHIP_INGEST_USER_ID is not configured");
  }

  const owner = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, ingestUserId))
    .limit(1);

  if (owner.length === 0) {
    throw new Error("INTERNSHIP_INGEST_USER_ID does not match any user");
  }

  return ingestUserId;
}

export function buildInternshipInsertValues(
  records: InternshipIngestRecord[],
  ingestUserId: string
): (typeof internships.$inferInsert)[] {
  return records.map((record) => {
    const fallbackText = `${record.title ?? ""} ${record.description ?? ""} ${record.rawText ?? ""}`;

    const normalizedType = normalizeType(record.type, fallbackText);
    const normalizedTiming = normalizeTiming(record.timing, fallbackText);
    const parsedStipend = parseStipend(record.stipend, fallbackText);
    const parsedDeadline = parseDeadline(record.deadline, fallbackText);

    return {
      title: record.title.trim(),
      description: record.description?.trim() || null,
      type: normalizedType,
      timing: normalizedTiming,
      link: record.link.trim(),
      stipend: parsedStipend,
      duration: record.duration?.trim() || null,
      experience: record.experience?.trim() || null,
      location: record.location?.trim() || null,
      deadline: parsedDeadline,
      tags: normalizeTags(record.tags),
      hiringOrganization: record.hiringOrganization.trim(),
      hiringManager: record.hiringManager?.trim() || null,
      isVerified: record.isVerified ?? false,
      isActive: record.isActive ?? true,
      userId: ingestUserId,
    };
  });
}
