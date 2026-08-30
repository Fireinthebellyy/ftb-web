import type { Metadata } from "next";
import { db } from "@/lib/db";
import { toolkits } from "@/lib/schema";
import { eq } from "drizzle-orm";
import ToolkitDetailClient from "./ToolkitDetailClient";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const result = await db
      .select({
        title: toolkits.title,
        description: toolkits.description,
        coverImageUrl: toolkits.coverImageUrl,
        bannerImageUrl: toolkits.bannerImageUrl,
      })
      .from(toolkits)
      .where(eq(toolkits.id, id))
      .limit(1);

    const toolkit = result?.[0];
    if (!toolkit) {
      return {
        title: "Toolkit — Fire in the Belly",
        description: "A step-by-step career playbook for ambitious Indian students.",
      };
    }

    const imageUrl = toolkit.coverImageUrl ?? toolkit.bannerImageUrl ?? null;
    const description = toolkit.description?.substring(0, 160) ?? "A step-by-step career playbook for ambitious Indian students.";

    return {
      title: `${toolkit.title} — Fire in the Belly Toolkit`,
      description,
      openGraph: {
        title: `${toolkit.title} — Fire in the Belly`,
        description,
        ...(imageUrl ? { images: [{ url: imageUrl, width: 1200, height: 630 }] } : {}),
      },
      twitter: {
        card: imageUrl ? "summary_large_image" : "summary",
        title: `${toolkit.title} — Fire in the Belly`,
        description,
      },
    };
  } catch {
    return {
      title: "Toolkit — Fire in the Belly",
      description: "A step-by-step career playbook for ambitious Indian students.",
    };
  }
}

export default function ToolkitDetailPage() {
  return <ToolkitDetailClient />;
}
