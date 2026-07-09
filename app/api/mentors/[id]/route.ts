import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mentors } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: "Mentor ID required" }, { status: 400 });
    }

    const mentor = await db.query.mentors.findFirst({
      where: eq(mentors.id, id)
    });

    if (!mentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    const safeMentor = {
      id: mentor.id,
      mentorName: mentor.mentorName,
      mentorImage: mentor.mentorImage,
      description: mentor.description,
      tags: mentor.tags,
      linkedinLink: mentor.linkedinLink,
      githubLink: mentor.githubLink,
      instaLink: mentor.instaLink,
      customLink: mentor.customLink,
      rating: mentor.rating,
      availability: mentor.availability,
    };

    return NextResponse.json(safeMentor);
  } catch (error) {
    console.error("Error fetching mentor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
