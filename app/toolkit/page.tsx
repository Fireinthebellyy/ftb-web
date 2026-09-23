import type { Metadata } from "next";
import ToolkitPageClient from "./ToolkitPageClient";
import { db } from "@/lib/db";
import { toolkitTestimonialImages } from "@/lib/schema";
import { asc, eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Toolkits — Career Playbooks That Actually Work",
  description:
    "Step-by-step playbooks for cold emails, interviews, case competitions, and more. Built for ambitious students who want real results.",
  openGraph: {
    title: "Career Toolkits — Fire in the Belly",
    description:
      "Playbooks for cold emails, interviews, and case competitions. Built for India's ambitious students.",
    images: [
      {
        url: "/images/og-toolkit.png",
        width: 1200,
        height: 630,
        alt: "Fire in the Belly Toolkits",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Career Toolkits — Fire in the Belly",
    description:
      "Playbooks for cold emails, interviews, and case competitions. Built for India's ambitious students.",
  },
};

export default async function ToolkitPage() {
  let testimonialImages: { imageUrl: string }[] = [];

  try {
    testimonialImages = await db
      .select({
        imageUrl: toolkitTestimonialImages.imageUrl,
      })
      .from(toolkitTestimonialImages)
      .where(eq(toolkitTestimonialImages.isActive, true))
      .orderBy(asc(toolkitTestimonialImages.orderIndex));
  } catch (error) {
    console.error("Failed to load toolkit testimonial images:", error);
  }

  return (
    <ToolkitPageClient
      testimonialImages={testimonialImages.map((item) => item.imageUrl)}
    />
  );
}