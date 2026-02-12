import { db } from "@/lib/db";
import { internships, user } from "@/lib/schema";
import {
  SQL,
  and,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { getSessionCached } from "@/lib/auth-session-cache";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const canonicalTypes = ["remote", "hybrid", "onsite"] as const;
const canonicalTimings = ["full_time", "part_time"] as const;

const internshipSchema = z.object({
  title: z.string().min(1, "Title is required"),
  hiringOrganization: z.string().min(1, "Hiring organization is required"),
  link: z.string().url("Valid application link is required"),
  description: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  timing: z.string().optional().nullable(),
  stipend: z.union([z.number().min(0), z.string()]).optional().nullable(),
  duration: z.string().optional().nullable(),
  experience: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  tags: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .nullable(),
  hiringManager: z.string().optional().nullable(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
  rawText: z.string().optional().nullable(),
});

const internshipBatchSchema = z.array(internshipSchema).min(1);

function normalizeType(value?: string | null, fallbackText?: string | null) {
  const normalized = (value ?? "").trim().toLowerCase();
  if (["work-from-home", "work_from_home", "wfh", "remote"].includes(normalized)) {
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
  if (["part-time", "part_time", "part time", "shift-based", "shift_based"].includes(normalized)) {
    return "part_time";
  }
  if (canonicalTimings.includes(normalized as (typeof canonicalTimings)[number])) {
    return normalized as (typeof canonicalTimings)[number];
  }

  const haystack = (fallbackText ?? "").toLowerCase();
  if (/\bfull\s*-?\s*time\b/.test(haystack)) {
    return "full_time";
  }
  if (/\bpart\s*-?\s*time\b/.test(haystack) || /\bshift\s*-?\s*based\b/.test(haystack)) {
    return "part_time";
  }

  return null;
}

function normalizeTags(tags: string[] | string | null | undefined) {
  if (!tags) {
    return [];
  }

  if (Array.isArray(tags)) {
    return tags
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);
  }

  return tags
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function parseStipend(stipend: string | number | null | undefined, fallbackText?: string | null) {
  if (typeof stipend === "number" && Number.isFinite(stipend)) {
    return stipend;
  }

  const fromValue = typeof stipend === "string" ? stipend : "";
  const source = `${fromValue} ${fallbackText ?? ""}`;
  const match = source.match(/(?:₹|rs\.?|inr)?\s*([0-9][0-9,]*)\s*(?:\/?\s*month|pm|per\s*month)?/i);

  if (!match) {
    return null;
  }

  const parsed = Number.parseInt(match[1].replace(/,/g, ""), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseDeadline(deadline: string | null | undefined, fallbackText?: string | null) {
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

  const slashDate = text.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/);
  if (slashDate?.[1]) {
    const parsed = new Date(slashDate[1]);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  }

  return null;
}

async function getIngestUserId() {
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

export async function POST(req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const isBatch = Array.isArray(body);
    const records = isBatch
      ? internshipBatchSchema.parse(body)
      : [internshipSchema.parse(body)];

    const ingestUserId = await getIngestUserId();

    const values: typeof internships.$inferInsert[] = records.map((record) => {
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

    const inserted = await db.insert(internships).values(values).returning();

    return NextResponse.json(
      {
        success: true,
        count: inserted.length,
        data: isBatch ? inserted : inserted[0],
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error creating internship:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    let isAdmin = false;
    try {
      const requestHeaders = await headers();
      const hasCookie = Boolean(requestHeaders.get("cookie"));
      if (hasCookie) {
        const session = await getSessionCached(requestHeaders);
        isAdmin = session?.user?.role === "admin";
      }
    } catch {
      isAdmin = false;
    }

    const { searchParams } = new URL(req.url);
    const limitParam = Number.parseInt(searchParams.get("limit") ?? "", 10);
    const offsetParam = Number.parseInt(searchParams.get("offset") ?? "", 10);
    const searchParam = searchParams.get("search");
    const typesParam = searchParams.get("types") ?? searchParams.get("type");
    const tagsParam = searchParams.get("tags");
    const locationParam = searchParams.get("location");
    const minStipendParam = Number.parseInt(
      searchParams.get("minStipend") ?? "",
      10
    );
    const maxStipendParam = Number.parseInt(
      searchParams.get("maxStipend") ?? "",
      10
    );

    const limit = Number.isNaN(limitParam) ? 10 : limitParam;
    const offset = Number.isNaN(offsetParam) ? 0 : offsetParam;
    const searchTerm = searchParam ? searchParam.trim() : "";
    const rawTypes = typesParam
      ? typesParam
          .split(",")
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean)
      : [];
    const validTypes = rawTypes.filter((type) =>
      canonicalTypes.includes(type as (typeof canonicalTypes)[number])
    );
    const rawTags = tagsParam
      ? tagsParam
          .split(",")
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean)
      : [];
    const location = locationParam ? locationParam.trim() : "";
    const minStipend = Number.isNaN(minStipendParam)
      ? undefined
      : minStipendParam;
    const maxStipend = Number.isNaN(maxStipendParam)
      ? undefined
      : maxStipendParam;

    const conditions: SQL<unknown>[] = [isNull(internships.deletedAt)];

    if (!isAdmin) {
      conditions.push(eq(internships.isActive, true));
    }

    if (searchTerm) {
      conditions.push(
        or(
          ilike(internships.title, `%${searchTerm}%`),
          ilike(internships.description, `%${searchTerm}%`),
          ilike(internships.hiringOrganization, `%${searchTerm}%`)
        )
      );
    }

    if (validTypes.length > 0) {
      conditions.push(inArray(internships.type, validTypes));
    }

    if (rawTags.length > 0) {
      const tagConditions = rawTags.map(
        (tag) =>
          sql`EXISTS (
            SELECT 1
            FROM unnest(coalesce(${internships.tags}, '{}'::text[])) AS t(tag_name)
            WHERE lower(t.tag_name) = ${tag}
          )`
      );

      if (tagConditions.length === 1) {
        conditions.push(tagConditions[0]);
      } else {
        conditions.push(or(...tagConditions));
      }
    }

    if (location) {
      conditions.push(ilike(internships.location, `%${location}%`));
    }

    if (minStipend !== undefined) {
      conditions.push(gte(internships.stipend, minStipend));
    }

    if (maxStipend !== undefined) {
      conditions.push(lte(internships.stipend, maxStipend));
    }

    const filters =
      conditions.length === 1 ? conditions[0] : and(...conditions);

    const paginated = await db
      .select({
        id: internships.id,
        title: internships.title,
        description: internships.description,
        type: internships.type,
        timing: internships.timing,
        link: internships.link,
        tags: internships.tags,
        stipend: internships.stipend,
        duration: internships.duration,
        experience: internships.experience,
        location: internships.location,
        deadline: internships.deadline,
        hiringOrganization: internships.hiringOrganization,
        hiringManager: internships.hiringManager,
        createdAt: internships.createdAt,
        updatedAt: internships.updatedAt,
        isVerified: internships.isVerified,
        isActive: internships.isActive,
        userId: internships.userId,
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
          role: user.role,
        },
      })
      .from(internships)
      .leftJoin(user, eq(internships.userId, user.id))
      .where(filters)
      .orderBy(desc(internships.createdAt))
      .limit(limit + 1)
      .offset(offset);

    const hasMore = paginated.length > limit;
    const pageItems = hasMore ? paginated.slice(0, limit) : paginated;
    const totalCount = hasMore ? offset + limit + 1 : offset + pageItems.length;

    return NextResponse.json(
      {
        success: true,
        internships: pageItems,
        pagination: {
          limit,
          offset,
          total: totalCount,
          hasMore,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching internships:", error);
    return NextResponse.json(
      { error: "Failed to fetch internships" },
      { status: 500 }
    );
  }
}
