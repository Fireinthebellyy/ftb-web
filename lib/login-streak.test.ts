import { describe, expect, it, vi } from "vitest";
import {
  computeLoginStreakUpdate,
  getDaysDifferenceInIST,
  getDisplayStreak,
  isValidCalendarDateString,
  normalizeDateToISTString,
} from "./login-streak";

describe("login-streak utils", () => {
  describe("isValidCalendarDateString & normalizeDateToISTString", () => {
    it("handles null or undefined", () => {
      expect(normalizeDateToISTString(null)).toBeNull();
      expect(normalizeDateToISTString(undefined)).toBeNull();
      expect(normalizeDateToISTString("")).toBeNull();
    });

    it("handles valid YYYY-MM-DD strings directly", () => {
      expect(normalizeDateToISTString("2026-08-31")).toBe("2026-08-31");
      expect(normalizeDateToISTString("2026-09-01")).toBe("2026-09-01");
      expect(isValidCalendarDateString("2028-02-29")).toBe(true); // leap year
    });

    it("rejects invalid calendar dates such as 2026-02-30, 2025-02-29, and 2026-08-32", () => {
      expect(isValidCalendarDateString("2026-02-30")).toBe(false);
      expect(normalizeDateToISTString("2026-02-30")).toBeNull();

      expect(isValidCalendarDateString("2025-02-29")).toBe(false);
      expect(normalizeDateToISTString("2025-02-29")).toBeNull();

      expect(isValidCalendarDateString("2026-08-32")).toBe(false);
      expect(normalizeDateToISTString("2026-08-32")).toBeNull();
    });

    it("handles ISO strings and Date objects", () => {
      const date = new Date("2026-08-31T18:30:00.000Z");
      expect(normalizeDateToISTString(date)).toBe("2026-09-01"); // 18:30 UTC is 00:00 IST next day
      expect(normalizeDateToISTString("2026-08-31T00:00:00.000Z")).toBe(
        "2026-08-31"
      );
    });
  });

  describe("getDaysDifferenceInIST", () => {
    it("calculates difference across same month", () => {
      expect(getDaysDifferenceInIST("2026-08-01", "2026-08-02")).toBe(1);
      expect(getDaysDifferenceInIST("2026-08-01", "2026-08-01")).toBe(0);
    });

    it("calculates difference across month boundaries", () => {
      expect(getDaysDifferenceInIST("2026-08-31", "2026-09-01")).toBe(1);
      expect(getDaysDifferenceInIST("2026-08-30", "2026-09-01")).toBe(2);
    });

    it("calculates difference across leap year boundaries", () => {
      // 2028 is a leap year (Feb 29 exists)
      expect(getDaysDifferenceInIST("2028-02-28", "2028-03-01")).toBe(2);
      expect(getDaysDifferenceInIST("2028-02-29", "2028-03-01")).toBe(1);

      // 2027 is not a leap year (Feb 28 to Mar 1 is 1 day)
      expect(getDaysDifferenceInIST("2027-02-28", "2027-03-01")).toBe(1);
    });

    it("calculates difference across year boundaries", () => {
      expect(getDaysDifferenceInIST("2026-12-31", "2027-01-01")).toBe(1);
    });

    it("returns Infinity if either date is invalid", () => {
      expect(getDaysDifferenceInIST("2026-02-30", "2026-03-01")).toBe(Infinity);
      expect(getDaysDifferenceInIST("2026-08-31", "2026-08-32")).toBe(Infinity);
    });
  });

  describe("computeLoginStreakUpdate", () => {
    it("increments streak beyond 30 days without capping", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-09-01T10:00:00+05:30"));

      const res31 = computeLoginStreakUpdate(30, "2026-08-31");
      expect(res31.streak).toBe(31);
      expect(res31.changed).toBe(true);
      expect(res31.lastLoginDate).toBe("2026-09-01");

      const res101 = computeLoginStreakUpdate(100, "2026-08-31");
      expect(res101.streak).toBe(101);

      vi.useRealTimers();
    });

    it("handles month transition seamlessly (e.g. Aug 31 to Sep 1)", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-09-01T08:00:00+05:30"));

      const res = computeLoginStreakUpdate(15, "2026-08-31");
      expect(res.streak).toBe(16);
      expect(res.changed).toBe(true);
      expect(res.lastLoginDate).toBe("2026-09-01");

      vi.useRealTimers();
    });

    it("returns changed=false when user logs in multiple times on the same day", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-09-01T15:00:00+05:30"));

      const res = computeLoginStreakUpdate(16, "2026-09-01");
      expect(res.streak).toBe(16);
      expect(res.changed).toBe(false);

      vi.useRealTimers();
    });

    it("resets streak to 1 when a day is missed across month boundary", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-09-02T10:00:00+05:30"));

      const res = computeLoginStreakUpdate(25, "2026-08-31");
      expect(res.streak).toBe(1);
      expect(res.changed).toBe(true);
      expect(res.lastLoginDate).toBe("2026-09-02");

      vi.useRealTimers();
    });
  });

  describe("getDisplayStreak", () => {
    it("returns full streak when last login was today or yesterday", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-09-01T10:00:00+05:30"));

      expect(getDisplayStreak(45, "2026-09-01")).toBe(45);
      expect(getDisplayStreak(45, "2026-08-31")).toBe(45);

      vi.useRealTimers();
    });

    it("returns 0 when last login was more than 1 day ago", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-09-01T10:00:00+05:30"));

      expect(getDisplayStreak(45, "2026-08-30")).toBe(0);

      vi.useRealTimers();
    });
  });
});
