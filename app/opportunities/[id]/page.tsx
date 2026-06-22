import { db } from "@/lib/db";
import { tags, opportunities } from "@/lib/schema";
import OpportunityList from "../OpportunityList";
import { eq } from "drizzle-orm";
import { Metadata } from "next";

type OpportunityDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: OpportunityDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const result = await db
      .select({
        title: opportunities.title,
        description: opportunities.description,
      })
      .from(opportunities)
      .where(eq(opportunities.id, id))
      .limit(1);

    const opportunity = result?.[0];
    if (opportunity) {
      return {
        title: `${opportunity.title} - Fire in the Belly`,
        description: opportunity.description.substring(0, 160),
      };
    }
  } catch (error) {
    console.error("Error generating metadata for opportunity:", error);
  }

  return {
    title: "Opportunity - Fire in the Belly",
    description: "Discover amazing opportunities.",
  };
}

export default async function OpportunityDetailPage({
  params,
}: OpportunityDetailPageProps) {
  const { id } = await params;

  let initialTags: string[] = [];
  try {
    const dbTags = await db.select({ name: tags.name }).from(tags);
    initialTags = dbTags.map((t) => t.name);
  } catch (error) {
    console.error(
      "Error fetching initial tags in OpportunityDetailPage:",
      error
    );
    initialTags = [];
  }

  return <OpportunityList initialTags={initialTags} highlightId={id} />;
}
