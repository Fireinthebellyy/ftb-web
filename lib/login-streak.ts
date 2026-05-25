export const MAX_LOGIN_STREAK = 30;

/** Calendar date (YYYY-MM-DD) in IST for streak boundaries. */
export function getCalendarDateInIST(date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export function getYesterdayInIST(): string {
  return getCalendarDateInIST(new Date(Date.now() - 86_400_000));
}

export function getDisplayStreak(
  streak: number,
  lastLoginDate: string | null
): number {
  if (!lastLoginDate) return 0;
  const today = getCalendarDateInIST();
  const yesterday = getYesterdayInIST();
  if (lastLoginDate === today || lastLoginDate === yesterday) {
    return Math.min(Math.max(streak, 0), MAX_LOGIN_STREAK);
  }
  return 0;
}

export function computeLoginStreakUpdate(
  currentStreak: number,
  lastLoginDate: string | null
): { streak: number; lastLoginDate: string; changed: boolean } {
  const today = getCalendarDateInIST();
  const yesterday = getYesterdayInIST();
  const safeStreak = Math.min(Math.max(currentStreak, 0), MAX_LOGIN_STREAK);

  if (lastLoginDate === today) {
    return { streak: safeStreak, lastLoginDate: today, changed: false };
  }

  if (lastLoginDate === yesterday) {
    return {
      streak: Math.min(safeStreak + 1, MAX_LOGIN_STREAK),
      lastLoginDate: today,
      changed: true,
    };
  }

  return { streak: 1, lastLoginDate: today, changed: true };
}
