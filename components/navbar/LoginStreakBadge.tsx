"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoginStreakBadgeProps {
  userId: string | undefined;
  className?: string;
}

export function LoginStreakBadge({ userId, className }: LoginStreakBadgeProps) {
  const { data } = useQuery({
    queryKey: ["login-streak", userId],
    queryFn: async () => {
      const { data: res } = await axios.get<{ streak: number }>(
        "/api/user/streak"
      );
      return res.streak;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const streak = data ?? 0;

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700",
        className
      )}
      title={`${streak} day login streak (max 30)`}
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
