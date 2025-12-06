import { db } from "@/lib/db";
import { opportunities, tags, user } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";
import OpportunityCard from "@/components/OpportunityCard";
import { notFound } from "next/navigation";

export default async function OpportunityDetailPage({ params }: any) {
  const id = params.id;

  const result = await db
    .select({
      id: opportunities.id,
      type: opportunities.type,
      title: opportunities.title,
      description: opportunities.description,
      images: opportunities.images,
      tagIds: opportunities.tagIds,
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
      },
    })
    .from(opportunities)
    .leftJoin(user, eq(opportunities.userId, user.id))
    .where(eq(opportunities.id, id))
    .limit(1);

  // Fetch tag names from tagIds
  let tagNames: string[] = [];
  if (result?.[0]?.tagIds && result[0].tagIds.length > 0) {
    const tagRows = await db
      .select({ name: tags.name })
      .from(tags)
      .where(inArray(tags.id, result[0].tagIds));

    tagNames = tagRows.map((row) => row.name);
  }

  const opportunity = result?.[0]
    ? { ...result[0], tags: tagNames }
    : null;
  if (!opportunity) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <OpportunityCard opportunity={opportunity as any} isCardExpanded={true} />
    </div>
  );
}
