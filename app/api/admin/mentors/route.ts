import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mentors } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

const mentorSchema = z.object({
  mentorName: z.string().min(1, "Name is required"),
  mentorEmail: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  mentorNumber: z.string().optional(),
  mentorImage: z.string().optional(),
  description: z.string().optional(),
  isVerified: z.boolean().default(true),
  linkedinLink: z.string().min(1, "LinkedIn link is required"),
  githubLink: z.string().optional().nullable(),
  instaLink: z.string().optional().nullable(),
  customLink: z.string().optional().nullable(),
  rating: z.number().optional(),
  availability: z.boolean().default(true),
  userId: z.string().min(1, "User ID is required"),
});

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allMentors = await db.select().from(mentors);
    return NextResponse.json(allMentors);
  } catch (error) {
    console.error("Error fetching mentors:", error);
    return NextResponse.json(
      { error: "Failed to fetch mentors", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = mentorSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Guard: prevent duplicate mentor records for the same user
    const existing = await db.query.mentors.findFirst({
      where: eq(mentors.userId, parsed.data.userId),
    });
    if (existing) {
      return NextResponse.json(
        { error: `A mentor record already exists for this user (id: ${existing.id}). Update it instead of creating a new one.` },
        { status: 409 }
      );
    }

    const [newMentor] = await db
      .insert(mentors)
      .values({
        mentorName: parsed.data.mentorName,
        mentorEmail: parsed.data.mentorEmail,
        mentorNumber: parsed.data.mentorNumber,
        mentorImage: parsed.data.mentorImage,
        description: parsed.data.description,
        isVerified: parsed.data.isVerified,
        linkedinLink: parsed.data.linkedinLink,
        githubLink: parsed.data.githubLink,
        instaLink: parsed.data.instaLink,
        customLink: parsed.data.customLink,
        rating: parsed.data.rating,
        availability: parsed.data.availability,
        userId: parsed.data.userId,
      })
      .returning();

    return NextResponse.json(newMentor);
  } catch (error) {
    console.error("Error creating mentor:", error);
    return NextResponse.json(
      { error: "Failed to create mentor" },
      { status: 500 }
    );
  }
}
