import { describe, expect, it } from "vitest";
import {
  formatGoogleCalendarDate,
  getTrackerDisplayValues,
} from "@/components/tracker/utils";

describe("tracker utils", () => {
  describe("getTrackerDisplayValues", () => {
    it("returns trimmed values and initial from company", () => {
      const result = getTrackerDisplayValues({
        company: "  Acme  ",
        title: "  Internship  ",
      });

      expect(result).toEqual({
        companyName: "Acme",
        titleText: "Internship",
        avatarInitial: "A",
      });
    });

    it("falls back to archive defaults", () => {
      const result = getTrackerDisplayValues({
        company: "",
        title: "",
      });

      expect(result).toEqual({
        companyName: "Source unavailable",
        titleText: "Archived item",
        avatarInitial: "S",
      });
    });
  });

  describe("formatGoogleCalendarDate", () => {
    it("returns null for nullable or invalid values", () => {
      expect(formatGoogleCalendarDate(null)).toBeNull();
      expect(formatGoogleCalendarDate(undefined)).toBeNull();
      expect(formatGoogleCalendarDate("invalid-date")).toBeNull();
    });

    it("formats ISO string to Google Calendar format", () => {
      const formatted = formatGoogleCalendarDate("2026-04-04T10:15:30.000Z");
      expect(formatted).toBe("20260404T101530Z");
    });

    it("handles timezone offsets consistently", () => {
      const formatted = formatGoogleCalendarDate("2026-04-04T10:15:30+05:30");
      expect(formatted).toBe("20260404T044530Z");
    });

    it("handles DST transition timestamps", () => {
      const beforeDst = formatGoogleCalendarDate("2026-03-08T01:30:00-08:00");
      const afterDst = formatGoogleCalendarDate("2026-03-08T03:30:00-07:00");

      expect(beforeDst).toBe("20260308T093000Z");
      expect(afterDst).toBe("20260308T103000Z");
    });
  });
});
