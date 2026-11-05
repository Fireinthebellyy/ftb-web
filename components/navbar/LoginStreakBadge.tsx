"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Flame } from "lucide-react";
import posthog from "posthog-js";
import type { ConsistencyStatus, ConsistencyTier } from "@/lib/login-streak";
import { cn } from "@/lib/utils";

interface LoginStreakResponse {
  streak: number;
  previousStreak?: number;
  lastLoginDate?: string;
  previousLoginDate?: string | null;
  daysSinceLastLogin?: number | null;
  consistencyStatus?: ConsistencyStatus;
  consistencyTier?: ConsistencyTier;
  consistencyScore?: number;
  accountAgeDays?: number;
  changed?: boolean;
  userId?: string;
  email?: string;
  name?: string;
}

interface LoginStreakBadgeProps {
  userId: string | undefined;
  className?: string;
}

export function LoginStreakBadge({ userId, className }: LoginStreakBadgeProps) {
  const { data } = useQuery({
    queryKey: ["login-streak", userId],
    queryFn: async () => {
      const { data: res } =
        await axios.get<LoginStreakResponse>("/api/user/streak");
      return res;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  useEffect(() => {
    if (!data || !userId) return;

    const loginDate = data.lastLoginDate || "";
    const storageKey = `ftb_streak_tracked_${userId}_${loginDate}`;

    let alreadyTrackedToday = false;
    if (typeof window !== "undefined" && loginDate) {
      try {
        alreadyTrackedToday = localStorage.getItem(storageKey) === "1";
      } catch {
        // Ignore storage read errors
      }
    }

    if (alreadyTrackedToday && !data.changed) {
      return;
    }

    posthog.capture("user_streak_tracked", {
      user_id: data.userId || userId,
      email: data.email || undefined,
      name: data.name || undefined,
      streak_count: data.streak,
      previous_streak: data.previousStreak ?? data.streak,
      consistency_status: data.consistencyStatus ?? "same_day",
      consistency_tier: data.consistencyTier ?? "new",
      consistency_score: data.consistencyScore ?? 100,
      days_since_last_login: data.daysSinceLastLogin ?? 0,
      account_age_days: data.accountAgeDays ?? 1,
      last_login_date: data.lastLoginDate,
      previous_login_date: data.previousLoginDate ?? null,
      $set: {
        ...(data.email ? { email: data.email } : {}),
        ...(data.name ? { name: data.name } : {}),
        login_streak: data.streak,
        consistency_tier: data.consistencyTier ?? "new",
        consistency_score: data.consistencyScore ?? 100,
        consistency_status: data.consistencyStatus ?? "same_day",
        last_login_date: data.lastLoginDate,
      },
    });

    if (typeof window !== "undefined" && loginDate) {
      try {
        localStorage.setItem(storageKey, "1");
      } catch {
        // Ignore storage write errors
      }
    }
  }, [data, userId]);

  const streak = data?.streak ?? 0;

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700",
        className
      )}
      title={`${streak} day login streak`}
      aria-label={`Login streak: ${streak} days`}
    >
      <Flame
        className="h-4 w-4 shrink-0 fill-orange-500 text-orange-500"
        aria-hidden
      />
      <span>{streak}</span>
    </div>
  );
}
