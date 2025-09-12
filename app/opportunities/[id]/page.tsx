import { db } from "@/lib/db";
import { opportunities, user } from "@/lib/schema";
import { eq } from "drizzle-orm";
import OpportunityCard from "@/components/OpportunityCard";
import { notFound } from "next/navigation";

export default async function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;

  const result = await db
    .select({
      id: opportunities.id,
      type: opportunities.type,
      title: opportunities.title,
      description: opportunities.description,
      images: opportunities.images,
      tags: opportunities.tags,
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

  const opportunity = result?.[0];
  if (!opportunity) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <OpportunityCard opportunity={opportunity as any} />
    </div>
  );
}


