import { db } from "@/lib/db";
import { opportunities, tags, user } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import OpportunityCard from "@/components/OpportunityCard";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type OpportunityDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OpportunityDetailPage({
  params,
}: OpportunityDetailPageProps) {
  const { id } = await params;

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
      applyLink: opportunities.applyLink,
      publishAt: opportunities.publishAt,
      userId: opportunities.userId,
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

  let currentUserId: string | undefined;
  let currentUserRole: string | undefined;
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    currentUserId = session?.user?.id as string | undefined;
    currentUserRole = session?.user?.role as string | undefined;
  } catch {}

  const isOwner =
    currentUserId !== undefined && opportunity.userId === currentUserId;
  const isAdmin = currentUserRole === "admin";
  const publishAt = opportunity.publishAt
    ? new Date(opportunity.publishAt)
    : null;
  const isScheduledFuture =
    publishAt !== null && publishAt.getTime() > Date.now();
  if (isScheduledFuture && !isOwner && !isAdmin) {
    notFound();
  }

  let userHasUpvoted = false;
  if (currentUserId && Array.isArray(opportunity.upvoterIds)) {
    userHasUpvoted = opportunity.upvoterIds.includes(currentUserId);
  }

  const opportunityWithUpvote = {
    ...opportunity,
    userHasUpvoted,
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <OpportunityCard
        opportunity={opportunityWithUpvote as any}
        isCardExpanded={true}
      />
    </div>
  );
}
