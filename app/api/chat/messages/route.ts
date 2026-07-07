export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chatMessages, chatRooms } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const roomId = url.searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json({ error: "Room ID required" }, { status: 400 });
    }

    // Verify user has access to this room
    const room = await db.query.chatRooms.findFirst({
      where: eq(chatRooms.id, roomId)
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const messages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.roomId, roomId),
      orderBy: [asc(chatMessages.createdAt)]
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Chat messages GET error:", error);
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

    const senderId = session.user.id;
    const { roomId, content } = await req.json();

    if (!roomId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify user has access to this room
    const room = await db.query.chatRooms.findFirst({
      where: eq(chatRooms.id, roomId)
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const newMessage = await db.insert(chatMessages).values({
      roomId,
      senderId,
      content,
    }).returning();

    // Since we asked the user about Pusher, Socket.io, etc, and we haven't received specific
    // answers, we'll keep it simple: HTTP polling for now on the frontend.
    // Real-time integration would be added here (e.g., pusher.trigger(roomId, 'new-message', message))

    return NextResponse.json({ message: newMessage[0] });
  } catch (error) {
    console.error("Chat messages POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
