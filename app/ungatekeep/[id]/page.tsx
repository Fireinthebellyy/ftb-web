import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ungatekeepPosts } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { stripHtml } from "@/lib/utils";
import { tryGetStoragePublicUrl } from "@/lib/storage/public-url";
import UngatekeepDetailClient from "./UngatekeepDetailClient";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const result = await db
      .select({
        content: ungatekeepPosts.content,
        linkTitle: ungatekeepPosts.linkTitle,
        attachments: ungatekeepPosts.attachments,
      })
      .from(ungatekeepPosts)
      .where(eq(ungatekeepPosts.id, id))
      .limit(1);

    const post = result?.[0];
    if (!post) {
      return {
        title: "Ungatekeep — Fire in the Belly",
        description: "Zero gatekeeping — real answers and advice for ambitious Indian students.",
      };
    }

    const plainText = stripHtml(post.content ?? "");
    const snippet = plainText.substring(0, 160);
    const firstAttachment = post.attachments?.[0] ?? null;
    const imageUrl = firstAttachment
      ? tryGetStoragePublicUrl("ungatekeep-images", firstAttachment)
      : null;

    return {
      title: post.linkTitle ?? "Ungatekeep Post — Fire in the Belly",
      description: snippet || "Zero gatekeeping — real answers and advice for ambitious Indian students.",
      openGraph: {
        title: post.linkTitle ?? "Ungatekeep — Fire in the Belly",
        description: snippet || "Zero gatekeeping — real answers, real advice for Indian students.",
        ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
      },
      twitter: {
        card: imageUrl ? "summary_large_image" : "summary",
        title: post.linkTitle ?? "Ungatekeep — Fire in the Belly",
        description: snippet || "Zero gatekeeping — real answers, real advice for Indian students.",
      },
    };
  } catch {
    return {
      title: "Ungatekeep — Fire in the Belly",
      description: "Zero gatekeeping — real answers and advice for ambitious Indian students.",
    };
  }
}

export default function UngatekeepPostPage() {
  return <UngatekeepDetailClient />;
}
