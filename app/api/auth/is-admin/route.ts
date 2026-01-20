import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ isAdmin: false });
    }

    const dbUser = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    });

    return NextResponse.json({
      isAdmin: dbUser?.role === "admin",
    });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json({ isAdmin: false });
  }
}
