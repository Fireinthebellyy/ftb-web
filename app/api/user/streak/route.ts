import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  computeLoginStreakUpdate,
  getDisplayStreak,
} from "@/lib/login-streak";
import { user } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [row] = await db
      .select({
        loginStreak: user.loginStreak,
        lastLoginDate: user.lastLoginDate,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    const currentStreak = row?.loginStreak ?? 0;
    const lastLoginDate = row?.lastLoginDate ?? null;

    const update = computeLoginStreakUpdate(currentStreak, lastLoginDate);

    if (update.changed) {
      await db
        .update(user)
        .set({
          loginStreak: update.streak,
          lastLoginDate: update.lastLoginDate,
          updatedAt: new Date(),
        })
        .where(eq(user.id, session.user.id));
    }

    const streak = update.changed
      ? update.streak
      : getDisplayStreak(currentStreak, lastLoginDate);

    return NextResponse.json({ streak });
  } catch (error) {
    console.error("Error updating login streak:", error);
    return NextResponse.json(
      { error: "Failed to load streak" },
      { status: 500 }
    );
  }
}
