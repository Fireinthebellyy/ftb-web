import { db } from "@/lib/db";
import { opportunities, tags, user } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import OpportunityCard from "@/components/OpportunityCard";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function OpportunityDetailPage({ params }: any) {
  const id = params.id;

  const result = await db
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
      createdAt: opportunities.createdAt,
      upvoteCount: opportunities.upvoteCount,
      upvoterIds: opportunities.upvoterIds,
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
        role: user.role,
      },
    })
    .from(opportunities)
    .leftJoin(user, eq(opportunities.userId, user.id))
    .where(eq(opportunities.id, id))
    .limit(1);

  const opportunity = result?.[0];
  if (!opportunity) {
    notFound();
  }

  // Calculate userHasUpvoted (non-redirecting check for public access)
  let userHasUpvoted = false;
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const currentUserId = session?.user?.id as string | undefined;
    if (currentUserId && Array.isArray(opportunity.upvoterIds)) {
      userHasUpvoted = opportunity.upvoterIds.includes(currentUserId);
    }
  } catch {
    // User not authenticated - allow public viewing with userHasUpvoted = false
  }

  const opportunityWithUpvote = {
    ...opportunity,
    userHasUpvoted,
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <OpportunityCard opportunity={opportunityWithUpvote as any} isCardExpanded={true} />
    </div>
  );
}
