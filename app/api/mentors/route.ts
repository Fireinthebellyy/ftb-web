import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mentors } from "@/lib/schema";

export async function GET() {
  try {
    const allMentors = await db.select().from(mentors);
    return NextResponse.json(allMentors);
  } catch (error) {
    console.error("Error fetching mentors:", error);
    return NextResponse.json(
      { error: "Failed to fetch mentors" },
      { status: 500 }
    );
  }
}
