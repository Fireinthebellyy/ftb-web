import { createApiTimer } from "@/lib/api-timing";
import { getSessionCached } from "@/lib/auth-session-cache";
import { db } from "@/lib/db";
import { bookmarks, opportunities, tags, tasks, user } from "@/lib/schema";
import {
  SQL,
  and,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  gte,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const timer = createApiTimer("GET /api/dashboard/bootstrap");

  try {
    timer.mark("auth_start");
    const session = await getSessionCached(await headers());
    timer.mark("auth_done", { hasSession: Boolean(session?.user?.id) });

    if (!session?.user?.id) {
      timer.end({ status: 401 });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limitParam = Number.parseInt(searchParams.get("limit") ?? "", 10);
    const search = (searchParams.get("search") ?? "").trim();
    const typesParam = searchParams.get("types") ?? "";
    const tagsParam = searchParams.get("tags") ?? "";
    const monthParam = searchParams.get("month") ?? "";
    const limit = Number.isNaN(limitParam)
      ? 10
      : Math.min(Math.max(limitParam, 1), 50);
    const offset = 0;

    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam)
      ? monthParam
      : defaultMonth;

    const rawTypes = typesParam
      ? typesParam
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];
    const allowedTypes = (opportunities.type.enumValues ?? []) as string[];
    const validTypes = rawTypes.filter((type) => allowedTypes.includes(type));
    const rawTags = tagsParam
      ? tagsParam
          .split(",")
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean)
      : [];

    timer.mark("role_start");
    const roleFromSession = (session.user as { role?: string }).role;
    const resolvedRole =
      roleFromSession ??
      (
        await db.query.user.findFirst({
          where: eq(user.id, session.user.id),
          columns: { role: true },
        })
      )?.role ??
      null;
    timer.mark("role_done", { hasRole: Boolean(resolvedRole) });

    if (!resolvedRole) {
      timer.end({ status: 401 });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conditions: SQL<unknown>[] = [isNull(opportunities.deletedAt)];

    conditions.push(eq(opportunities.isActive, true));
    conditions.push(
      or(
        isNull(opportunities.publishAt),
        lte(opportunities.publishAt, new Date())
      )
    );

    if (search) {
      conditions.push(
        or(
          ilike(opportunities.title, `%${search}%`),
          ilike(opportunities.description, `%${search}%`)
        )
      );
    }

    if (validTypes.length > 0) {
      conditions.push(inArray(opportunities.type, validTypes as any));
    }

    if (rawTags.length > 0) {
      const tagConditions = rawTags.map(
        (tag) =>
          sql`EXISTS (
            SELECT 1
            FROM ${tags} t
            WHERE lower(t.name) = ${tag}
              AND t.id = ANY(${opportunities.tagIds})
          )`
      );

      conditions.push(
        tagConditions.length === 1 ? tagConditions[0] : or(...tagConditions)
      );
    }

    const filters =
      conditions.length === 1 ? conditions[0] : and(...conditions);

    const [year, monthNumber] = month.split("-").map(Number);
    const startDate = new Date(year, monthNumber - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, monthNumber, 0, 23, 59, 59, 999);
    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    timer.mark("queries_start");

    const [opportunitiesResult, tasksResult, monthDatesResult] =
      await Promise.all([
        db
          .select({
            id: opportunities.id,
            type: opportunities.type,
            title: opportunities.title,
            description: opportunities.description,
            images: opportunities.images,
            tags: sql<string[]>`(
            SELECT coalesce(array_agg(t.name ORDER BY t.name), '{}')
            FROM ${tags} t
            WHERE t.id = ANY(${opportunities.tagIds})
          )`,
            location: opportunities.location,
            organiserInfo: opportunities.organiserInfo,
            startDate: opportunities.startDate,
            endDate: opportunities.endDate,
            publishAt: opportunities.publishAt,
            isFlagged: opportunities.isFlagged,
            createdAt: opportunities.createdAt,
            updatedAt: opportunities.updatedAt,
            isVerified: opportunities.isVerified,
            isActive: opportunities.isActive,
            upvoteCount: opportunities.upvoteCount,
            upvoterIds: opportunities.upvoterIds,
            userId: opportunities.userId,
            user: {
              id: user.id,
              name: user.name,
              image: user.image,
              role: user.role,
            },
          })
          .from(opportunities)
          .leftJoin(user, eq(opportunities.userId, user.id))
          .where(filters)
          .orderBy(desc(opportunities.createdAt))
          .limit(limit + 1)
          .offset(offset),
        db
          .select()
          .from(tasks)
          .where(eq(tasks.userId, session.user.id))
          .orderBy(tasks.completed, tasks.createdAt),
        db
          .select({ endDate: opportunities.endDate })
          .from(bookmarks)
          .innerJoin(
            opportunities,
            eq(bookmarks.opportunityId, opportunities.id)
          )
          .where(
            and(
              eq(bookmarks.userId, session.user.id),
              gte(opportunities.endDate, startStr),
              lte(opportunities.endDate, endStr)
            )
          )
          .orderBy(opportunities.endDate),
      ]);

    timer.mark("queries_done", {
      opportunitiesRows: opportunitiesResult.length,
      tasksRows: tasksResult.length,
      monthDateRows: monthDatesResult.length,
    });

    const hasMore = opportunitiesResult.length > limit;
    const pageItems = hasMore
      ? opportunitiesResult.slice(0, limit)
      : opportunitiesResult;
    const total = hasMore ? offset + limit + 1 : offset + pageItems.length;
    const currentUserId = session.user.id;

    const opportunitiesWithUpvote = pageItems.map((item) => ({
      ...item,
      userHasUpvoted:
        Boolean(currentUserId) && Array.isArray(item.upvoterIds)
          ? item.upvoterIds.includes(currentUserId)
          : false,
    }));

    const dates = Array.from(
      new Set(
        monthDatesResult
          .filter((item) => item.endDate)
          .map((item) => item.endDate)
      )
    ).sort();

    const opportunityIds = opportunitiesWithUpvote.map((item) => item.id);
    const bookmarkRows =
      opportunityIds.length > 0
        ? await db
            .select({ opportunityId: bookmarks.opportunityId })
            .from(bookmarks)
            .where(
              and(
                eq(bookmarks.userId, session.user.id),
                inArray(bookmarks.opportunityId, opportunityIds)
              )
            )
        : [];

    const bookmarkStatuses = bookmarkRows.reduce<Record<string, boolean>>(
      (acc, row) => {
        acc[row.opportunityId] = true;
        return acc;
      },
      {}
    );

    timer.end({
      status: 200,
      opportunities: opportunitiesWithUpvote.length,
      tasks: tasksResult.length,
      dates: dates.length,
      statuses: Object.keys(bookmarkStatuses).length,
    });

    return NextResponse.json({
      opportunities: opportunitiesWithUpvote,
      pagination: {
        limit,
        offset,
        total,
        hasMore,
      },
      tasks: tasksResult,
      bookmarkDates: dates,
      bookmarkStatuses,
      month,
    });
  } catch (error) {
    console.error("Error in dashboard bootstrap:", error);
    timer.end({ status: 500, reason: "exception" });
    return NextResponse.json(
      { error: "Failed to load dashboard bootstrap data" },
      { status: 500 }
    );
  }
}
