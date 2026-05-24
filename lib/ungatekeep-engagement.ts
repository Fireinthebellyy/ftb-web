import { sql } from "drizzle-orm";
import { ungatekeepPosts } from "@/lib/schema";

export function ungatekeepPostEngagementSelect(
  userId: string | null,
  postId = ungatekeepPosts.id
) {
  return {
    score: sql<number>`COALESCE((SELECT SUM(vote)::int FROM "ungatekeep_post_votes" WHERE "post_id" = ${postId}), 0)`.as(
      "score"
    ),
    userVote: userId
      ? sql<number>`COALESCE((SELECT vote FROM "ungatekeep_post_votes" WHERE "post_id" = ${postId} AND "user_id" = ${userId}), 0)`.as(
          "userVote"
        )
      : sql<number>`0`.as("userVote"),
    commentCount:
      sql<number>`COALESCE((SELECT COUNT(*)::int FROM "ungatekeep_comments" WHERE "post_id" = ${postId}), 0)`.as(
        "commentCount"
      ),
  };
}
