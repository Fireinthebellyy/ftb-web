import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mentors } from "@/lib/schema";
import { or, eq } from "drizzle-orm";

export async function GET() {
  try {
    const allMentors = await db.select({
      id: mentors.id,
      mentorName: mentors.mentorName,
      mentorImage: mentors.mentorImage,
      description: mentors.description,
      isVerified: mentors.isVerified,
      tags: mentors.tags,
      linkedinLink: mentors.linkedinLink,
      githubLink: mentors.githubLink,
      instaLink: mentors.instaLink,
      customLink: mentors.customLink,
      createdAt: mentors.createdAt,
      updatedAt: mentors.updatedAt,
      rating: mentors.rating,
      availability: mentors.availability,
    })
    .from(mentors)
    .where(or(eq(mentors.isVerified, true), eq(mentors.availability, true)));
    return NextResponse.json(allMentors);
  } catch (error) {
    console.error("Error fetching mentors:", error);
    return NextResponse.json(
      { error: "Failed to fetch mentors" },
      { status: 500 }
    );
  }
}
