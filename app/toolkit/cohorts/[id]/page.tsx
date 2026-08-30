import type { Metadata } from "next";
import { db } from "@/lib/db";
import { cohorts } from "@/lib/schema";
import { eq } from "drizzle-orm";
import CohortDetailClient from "./CohortDetailClient";

type Props = {
  params: Promise<{ id: string }>;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const result = await db
      .select({
        title: cohorts.title,
        subtitle: cohorts.subtitle,
        coverImageUrl: cohorts.coverImageUrl,
        cardImageUrl: cohorts.cardImageUrl,
      })
      .from(cohorts)
      .where(
        UUID_REGEX.test(id)
          ? eq(cohorts.id, id)
          : eq(cohorts.slug, id)
      )
      .limit(1);

    const cohort = result?.[0];
    if (!cohort) {
      return {
        title: "Cohort — Fire in the Belly",
        description: "Join a live cohort program with mentors, sessions, and community.",
      };
    }

    const imageUrl = cohort.coverImageUrl ?? cohort.cardImageUrl ?? null;
    const description =
      cohort.subtitle ??
      `Join the ${cohort.title} cohort — live sessions, mentors, and community for ambitious Indian students.`;

    return {
      title: `${cohort.title} — Fire in the Belly`,
      description: description.substring(0, 160),
      openGraph: {
        title: `${cohort.title} — Fire in the Belly`,
        description: description.substring(0, 160),
        ...(imageUrl ? { images: [{ url: imageUrl, width: 1200, height: 630 }] } : {}),
      },
      twitter: {
        card: imageUrl ? "summary_large_image" : "summary",
        title: `${cohort.title} — Fire in the Belly`,
        description: description.substring(0, 160),
      },
    };
  } catch {
    return {
      title: "Cohort — Fire in the Belly",
      description: "Join a live cohort program with mentors, sessions, and community.",
    };
  }
}

export default function CohortLandingPage() {
  return <CohortDetailClient />;
}
