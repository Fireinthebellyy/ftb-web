import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { ungatekeepBookmarks } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 });
    }

    const userId = session.user.id;

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(ungatekeepBookmarks)
      .where(eq(ungatekeepBookmarks.userId, userId));

    const count = Number(result[0]?.count ?? 0);

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching ungatekeep bookmark count:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookmark count" },
      { status: 500 }
    );
  }
}
