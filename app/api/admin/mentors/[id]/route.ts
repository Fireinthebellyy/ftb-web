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
  mentorImage: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isVerified: z.boolean().default(true),
  linkedinLink: z.string().min(1, "LinkedIn link is required"),
  githubLink: z.string().optional().nullable(),
  instaLink: z.string().optional().nullable(),
  customLink: z.string().optional().nullable(),
  rating: z.number().optional().nullable(),
  availability: z.boolean().default(true),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const json = await req.json();
    const parsed = mentorSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const [updatedMentor] = await db
      .update(mentors)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(mentors.id, id))
      .returning();

    if (!updatedMentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    return NextResponse.json(updatedMentor);
  } catch (error) {
    console.error("Error updating mentor:", error);
    return NextResponse.json(
      { error: "Failed to update mentor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await db.delete(mentors).where(eq(mentors.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting mentor:", error);
    return NextResponse.json(
      { error: "Failed to delete mentor" },
      { status: 500 }
    );
  }
}
