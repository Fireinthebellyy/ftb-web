/** Calendar date (YYYY-MM-DD) in IST for streak boundaries. */
export function getCalendarDateInIST(date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export function getYesterdayInIST(): string {
  return getCalendarDateInIST(new Date(Date.now() - 86_400_000));
}

/**
 * Validates whether a YYYY-MM-DD string represents a valid calendar date
 * (checking month length boundaries and leap years).
 */
export function isValidCalendarDateString(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [yearStr, monthStr, dayStr] = str.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Normalizes input date (string YYYY-MM-DD, ISO string, or Date object)
 * to a clean, validated calendar date string (YYYY-MM-DD) in IST timezone.
 */
export function normalizeDateToISTString(
  dateInput: string | Date | null | undefined
): string | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return null;
    const formatted = getCalendarDateInIST(dateInput);
    return isValidCalendarDateString(formatted) ? formatted : null;
  }
  const str = String(dateInput).trim();
  if (!str) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return isValidCalendarDateString(str) ? str : null;
  }

  const parsedDate = new Date(str);
  if (!isNaN(parsedDate.getTime())) {
    const formatted = getCalendarDateInIST(parsedDate);
    return isValidCalendarDateString(formatted) ? formatted : null;
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
  if (!isValidCalendarDateString(fromDateStr) || !isValidCalendarDateString(toDateStr)) {
    return Infinity;
  }
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

export interface LoginStreakUpdate {
  streak: number;
  lastLoginDate: string;
  changed: boolean;
}

export function computeLoginStreakUpdate(
  currentStreak: number,
  lastLoginDate: string | Date | null | undefined
): LoginStreakUpdate {
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
