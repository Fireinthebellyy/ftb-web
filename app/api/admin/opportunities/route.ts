import { db } from "@/lib/db";
import { opportunities, user, tags } from "@/lib/schema";
import { getCurrentUser } from "@/server/users";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull, sql, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        if (!db) {
            return NextResponse.json(
                { error: "Database connection not available" },
                { status: 500 }
            );
        }

        // Check if user is admin
        const currentUser = await getCurrentUser();
        if (currentUser?.currentUser?.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Get pagination parameters
        const { searchParams } = new URL(req.url);
        const limitParam = Number.parseInt(searchParams.get("limit") ?? "", 10);
        const offsetParam = Number.parseInt(searchParams.get("offset") ?? "", 10);
        const limit = Number.isNaN(limitParam) ? 10 : limitParam;
        const offset = Number.isNaN(offsetParam) ? 0 : offsetParam;

        // Validate pagination parameters
        const validLimit = Math.min(Math.max(limit, 1), 50);
        const validOffset = Math.max(offset, 0);

        // Get pending opportunities (isActive = false and not deleted)
        const conditions = and(
            eq(opportunities.isActive, false),
            isNull(opportunities.deletedAt)
        );

        const [totalResult, pendingOpportunities] = await Promise.all([
            db
                .select({ total: count() })
                .from(opportunities)
                .where(conditions),
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
                .where(conditions)
                .orderBy(desc(opportunities.createdAt))
                .limit(validLimit)
                .offset(validOffset),
        ]);

        const totalCount = totalResult[0]?.total ?? 0;
        const hasMore = validOffset + pendingOpportunities.length < totalCount;

        return NextResponse.json(
            {
                success: true,
                opportunities: pendingOpportunities,
                pagination: {
                    limit: validLimit,
                    offset: validOffset,
                    total: totalCount,
                    hasMore,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching pending opportunities:", error);
        return NextResponse.json(
            { error: "Failed to fetch pending opportunities" },
            { status: 500 }
        );
    }
}

// Helper function for count
function count() {
    return sql<number>`count(*)`;
}
