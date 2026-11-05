import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  computeAccountAgeDays,
  computeConsistencyScore,
  computeLoginStreakUpdate,
  getConsistencyTier,
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
        createdAt: user.createdAt,
        email: user.email,
        name: user.name,
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

    const accountAgeDays = computeAccountAgeDays(
      row?.createdAt ?? session.user.createdAt,
      update.lastLoginDate
    );
    const consistencyScore = computeConsistencyScore(streak, accountAgeDays);
    const consistencyTier = getConsistencyTier(streak);

    return NextResponse.json({
      streak,
      previousStreak: update.previousStreak,
      lastLoginDate: update.lastLoginDate,
      previousLoginDate: update.previousLoginDate,
      daysSinceLastLogin: update.daysSinceLastLogin,
      consistencyStatus: update.consistencyStatus,
      consistencyTier,
      consistencyScore,
      accountAgeDays,
      changed: update.changed,
      userId: session.user.id,
      email: row?.email ?? session.user.email ?? "",
      name: row?.name ?? session.user.name ?? "",
    });
  } catch (error) {
    console.error("Error updating login streak:", error);
    return NextResponse.json(
      { error: "Failed to load streak" },
      { status: 500 }
    );
  }
}
