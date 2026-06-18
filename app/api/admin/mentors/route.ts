import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mentors } from "@/lib/schema";

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

    const [newMentor] = await db
      .insert(mentors)
      .values({
        ...(parsed.data as z.infer<typeof mentorSchema>),
        userId: session.user.id,
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
