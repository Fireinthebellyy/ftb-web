import { db } from "@/lib/db";
import { upsertTagsAndGetIds } from "@/lib/tags";
import { opportunities, user } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const opportunityTypeValues = [
  "competitions_open_calls",
  "case_competitions",
  "hackathons",
  "fellowships",
  "ideathon_think_tanks",
  "leadership_programs",
  "awards_recognition",
  "grants_scholarships",
  "research_paper_ra_calls",
  "upskilling_events",
] as const;

const nullableDateStringSchema = z
  .union([z.string().min(1), z.literal(""), z.null()])
  .optional()
  .refine((value) => {
    if (value === undefined || value === null || value === "") {
      return true;
    }

    return !Number.isNaN(new Date(value).getTime());
  }, "Invalid date");

const nullableDateTimeStringSchema = z
  .union([z.string().min(1), z.literal(""), z.null()])
  .optional()
  .refine((value) => {
    if (value === undefined || value === null || value === "") {
      return true;
    }

    return !Number.isNaN(new Date(value).getTime());
  }, "Invalid datetime");

export const opportunityIngestRecordSchema = z.object({
  type: z.enum(opportunityTypeValues),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(5000),
  images: z.array(z.string().min(1).max(2048)).max(10).optional(),
  attachments: z.array(z.string().min(1).max(2048)).max(10).optional(),
  tags: z.array(z.string().min(1).max(50)).max(30).optional(),
  location: z.string().max(160).optional().nullable(),
  organiserInfo: z.string().max(500).optional().nullable(),
  startDate: nullableDateStringSchema,
  endDate: nullableDateStringSchema,
  publishAt: nullableDateTimeStringSchema,
});

export const opportunityIngestBatchSchema = z
  .array(opportunityIngestRecordSchema)
  .min(1)
  .max(500);

export type OpportunityIngestRecord = z.infer<
  typeof opportunityIngestRecordSchema
>;

function parseDateOnly(value: string | "" | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === "" || value === null) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().split("T")[0];
}

function parseDateTime(value: string | "" | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === "" || value === null) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function normalizeKeys(values: string[] | undefined) {
  if (!values || values.length === 0) {
    return [];
  }

  return values.map((value) => value.trim()).filter(Boolean);
}

function normalizeTags(tags: string[] | undefined) {
  if (!tags || tags.length === 0) {
    return [];
  }

  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
}

export async function getOpportunityIngestUserId() {
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

export async function buildOpportunityInsertValues(
  records: OpportunityIngestRecord[],
  ingestUserId: string
): Promise<(typeof opportunities.$inferInsert)[]> {
  const values: (typeof opportunities.$inferInsert)[] = [];

  for (const record of records) {
    const normalizedTags = normalizeTags(record.tags);
    const tagIds =
      normalizedTags.length > 0
        ? await upsertTagsAndGetIds(normalizedTags)
        : undefined;

    const insertValue: typeof opportunities.$inferInsert = {
      type: record.type,
      title: record.title.trim(),
      description: record.description.trim(),
      userId: ingestUserId,
      isActive: false,
      isVerified: false,
      isFlagged: false,
      images: normalizeKeys(record.images),
      attachments: normalizeKeys(record.attachments),
    };

    if (tagIds && tagIds.length > 0) {
      insertValue.tagIds = tagIds;
    }

    if (record.location !== undefined) {
      insertValue.location = record.location?.trim() || null;
    }

    if (record.organiserInfo !== undefined) {
      insertValue.organiserInfo = record.organiserInfo?.trim() || null;
    }

    const startDate = parseDateOnly(record.startDate);
    if (startDate !== undefined) {
      insertValue.startDate = startDate;
    }

    const endDate = parseDateOnly(record.endDate);
    if (endDate !== undefined) {
      insertValue.endDate = endDate;
    }

    const publishAt = parseDateTime(record.publishAt);
    if (publishAt !== undefined) {
      insertValue.publishAt = publishAt;
    }

    values.push(insertValue);
  }

  return values;
}
