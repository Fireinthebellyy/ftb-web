export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chatRooms, mentors, user } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mentorRecord = await db.query.mentors.findFirst({
      where: eq(mentors.userId, session.user.id),
    });

    if (!mentorRecord) {
      return NextResponse.json({ error: "Forbidden: Not a mentor" }, { status: 403 });
    }

    const rooms = await db
      .select({
        id: chatRooms.id,
        toolkitId: chatRooms.toolkitId,
        createdAt: chatRooms.createdAt,
        student: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      })
      .from(chatRooms)
      .innerJoin(user, eq(chatRooms.userId, user.id))
      .where(eq(chatRooms.mentorId, mentorRecord.id));

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error("Mentor chats GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
