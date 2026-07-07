export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chatRooms, mentors } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const url = new URL(req.url);
    const toolkitId = url.searchParams.get("toolkitId");

    if (!toolkitId) {
      return NextResponse.json({ error: "Toolkit ID required" }, { status: 400 });
    }

    // Check if user is student or mentor for this room
    // First, check if the user is a mentor themselves
    const mentorRecord = await db.query.mentors.findFirst({
      where: eq(mentors.userId, userId)
    });
    
    let room;
    if (mentorRecord) {
      // User is a mentor, fetch the room where they are the mentor
      // Wait, we need to know WHICH student they are chatting with. Or return all rooms for this mentor and toolkit.
      const rooms = await db.query.chatRooms.findMany({
        where: and(
          eq(chatRooms.toolkitId, toolkitId),
          eq(chatRooms.mentorId, mentorRecord.id)
        ),
      });
      return NextResponse.json({ rooms });
    } else {
      // User is a student, fetch their specific room for this toolkit
      room = await db.query.chatRooms.findFirst({
        where: and(
          eq(chatRooms.toolkitId, toolkitId),
          eq(chatRooms.userId, userId)
        )
      });
      return NextResponse.json({ room });
    }
  } catch (error) {
    console.error("Chat rooms GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { toolkitId, mentorId } = await req.json();

    if (!toolkitId || !mentorId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if room already exists
    const existingRoom = await db.query.chatRooms.findFirst({
      where: and(
        eq(chatRooms.toolkitId, toolkitId),
        eq(chatRooms.userId, userId),
        eq(chatRooms.mentorId, mentorId)
      )
    });

    if (existingRoom) {
      return NextResponse.json({ room: existingRoom });
    }

    // Create new room
    const newRoom = await db.insert(chatRooms).values({
      toolkitId,
      userId,
      mentorId,
    }).returning();

    return NextResponse.json({ room: newRoom[0] });
  } catch (error) {
    console.error("Chat rooms POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
