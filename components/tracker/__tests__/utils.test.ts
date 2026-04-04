import { describe, expect, it } from "vitest";
import {
  formatGoogleCalendarDate,
  getTrackerDisplayValues,
  getTrackerLogoUrl,
} from "@/components/tracker/utils";
import type { TrackerItem } from "@/components/providers/TrackerProvider";

const baseTrackerItem: TrackerItem = {
  oppId: "opp-1",
  status: "Not Applied",
  addedAt: "2026-01-01T00:00:00.000Z",
  appliedAt: null,
  result: null,
  notes: "",
};

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
        avatarInitial: "A",
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

  describe("getTrackerLogoUrl", () => {
    it("prefers snapshot logo when both snapshot and top-level logo exist", () => {
      const value = getTrackerLogoUrl({
        ...baseTrackerItem,
        snapshot: { logo: "https://cdn.example.com/snapshot.png" },
        logo: "https://cdn.example.com/top-level.png",
      });

      expect(value).toBe("https://cdn.example.com/snapshot.png");
    });

    it("returns top-level logo when snapshot logo is missing", () => {
      const value = getTrackerLogoUrl({
        ...baseTrackerItem,
        logo: "https://cdn.example.com/top-level.png",
        snapshot: { logo: "" },
      });

      expect(value).toBe("https://cdn.example.com/top-level.png");
    });

    it("returns empty fallback when no logo source is available", () => {
      const value = getTrackerLogoUrl({
        ...baseTrackerItem,
        logo: "",
        poster: "",
        images: [],
        snapshot: { logo: "", poster: "", images: [] },
      });

      expect(value).toBe("");
    });
  });
});
