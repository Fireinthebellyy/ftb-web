/** Calendar date (YYYY-MM-DD) in IST for streak boundaries. */
export function getCalendarDateInIST(date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export function getYesterdayInIST(): string {
  return getCalendarDateInIST(new Date(Date.now() - 86_400_000));
}

/**
 * Normalizes input date (string YYYY-MM-DD, ISO string, or Date object)
 * to a clean calendar date string (YYYY-MM-DD) in IST timezone.
 */
export function normalizeDateToISTString(
  dateInput: string | Date | null | undefined
): string | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return null;
    return getCalendarDateInIST(dateInput);
  }
  const str = String(dateInput).trim();
  if (!str) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  const parsedDate = new Date(str);
  if (!isNaN(parsedDate.getTime())) {
    return getCalendarDateInIST(parsedDate);
  }

  return null;
}

/**
 * Calculates calendar day difference in IST between two YYYY-MM-DD date strings (toDate - fromDate).
 */
export function getDaysDifferenceInIST(
  fromDateStr: string,
  toDateStr: string
): number {
  const utcFrom = Date.parse(`${fromDateStr}T00:00:00Z`);
  const utcTo = Date.parse(`${toDateStr}T00:00:00Z`);
  if (isNaN(utcFrom) || isNaN(utcTo)) return Infinity;
  return Math.round((utcTo - utcFrom) / 86_400_000);
}

export function getDisplayStreak(
  streak: number,
  lastLoginDate: string | Date | null | undefined
): number {
  const normLastLogin = normalizeDateToISTString(lastLoginDate);
  if (!normLastLogin) return 0;

  const today = getCalendarDateInIST();
  const diffDays = getDaysDifferenceInIST(normLastLogin, today);

  if (diffDays === 0 || diffDays === 1) {
    return Math.max(streak, 0);
  }

  return 0;
}

export function computeLoginStreakUpdate(
  currentStreak: number,
  lastLoginDate: string | Date | null | undefined
): { streak: number; lastLoginDate: string; changed: boolean } {
  const today = getCalendarDateInIST();
  const safeStreak = Math.max(currentStreak, 0);
  const normLastLogin = normalizeDateToISTString(lastLoginDate);

  if (!normLastLogin) {
    return { streak: 1, lastLoginDate: today, changed: true };
  }

  const diffDays = getDaysDifferenceInIST(normLastLogin, today);

  if (diffDays === 0) {
    return {
      streak: safeStreak === 0 ? 1 : safeStreak,
      lastLoginDate: today,
      changed: safeStreak === 0,
    };
  }

  if (diffDays === 1) {
    return {
      streak: safeStreak + 1,
      lastLoginDate: today,
      changed: true,
    };
  }

  if (diffDays < 0) {
    return {
      streak: safeStreak === 0 ? 1 : safeStreak,
      lastLoginDate: today,
      changed: true,
    };
  }

  return { streak: 1, lastLoginDate: today, changed: true };
}
