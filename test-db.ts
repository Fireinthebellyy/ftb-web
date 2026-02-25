import { db } from "./lib/db";
import { opportunities, tags, user } from "./lib/schema";
import { sql, eq, desc } from "drizzle-orm";

async function main() {
    try {
        const paginated = await db
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
            .orderBy(desc(opportunities.createdAt))
            .limit(1)
            .offset(0);
        console.log("Success fetching paginated data:", paginated.length);
    } catch (err: any) {
        console.error("DB Error Code:", err.code);
        console.error("DB Error Message:", err.message);
    }
}
main().catch(console.error);
