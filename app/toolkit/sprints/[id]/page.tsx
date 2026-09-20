import type { Metadata } from "next";
import { db } from "@/lib/db";
import { sprints } from "@/lib/schema";
import { eq } from "drizzle-orm";
import SprintDetailClient from "./SprintDetailClient";

type Props = {
  params: Promise<{ id: string }>;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const result = await db
      .select({
        title: sprints.title,
        subtitle: sprints.subtitle,
        coverImageUrl: sprints.coverImageUrl,
        cardImageUrl: sprints.cardImageUrl,
      })
      .from(sprints)
      .where(
        UUID_REGEX.test(id)
          ? eq(sprints.id, id)
          : eq(sprints.slug, id)
      )
      .limit(1);

    const sprint = result?.[0];
    if (!sprint) {
      return {
        title: "Sprint — Fire in the Belly",
        description: "Join an intensive sprint program with live sessions, mentors, and community.",
      };
    }

    const imageUrl = sprint.coverImageUrl ?? sprint.cardImageUrl ?? null;
    const description =
      sprint.subtitle ??
      `Join the ${sprint.title} sprint — live sessions, mentors, and community for ambitious Indian students.`;

    return {
      title: `${sprint.title} — Fire in the Belly`,
      description: description.substring(0, 160),
      openGraph: {
        title: `${sprint.title} — Fire in the Belly`,
        description: description.substring(0, 160),
        ...(imageUrl ? { images: [{ url: imageUrl, width: 1200, height: 630 }] } : {}),
      },
      twitter: {
        card: imageUrl ? "summary_large_image" : "summary",
        title: `${sprint.title} — Fire in the Belly`,
        description: description.substring(0, 160),
      },
    };
  } catch {
    return {
      title: "Sprint — Fire in the Belly",
      description: "Join an intensive sprint program with live sessions, mentors, and community.",
    };
  }
}

export default function SprintLandingPage() {
  return <SprintDetailClient />;
}
