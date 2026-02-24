import { describe, expect, it } from "vitest";
import { format } from "date-fns";
import { toDateTimeLocalValue } from "@/lib/date-utils";

describe("toDateTimeLocalValue", () => {
  it("returns empty string for undefined input", () => {
    expect(toDateTimeLocalValue(undefined)).toBe("");
  });

  it("returns empty string for invalid input", () => {
    expect(toDateTimeLocalValue("not-a-date")).toBe("");
  });

  it("formats Date input as local datetime-local value", () => {
    const localDate = new Date(2026, 1, 16, 14, 35, 0, 0);
    expect(toDateTimeLocalValue(localDate)).toBe("2026-02-16T14:35");
  });

  it("normalizes ISO string input to the local timezone", () => {
    const isoDateTime = "2026-02-16T18:45:00.000Z";
    const expected = format(new Date(isoDateTime), "yyyy-MM-dd'T'HH:mm");
    expect(toDateTimeLocalValue(isoDateTime)).toBe(expected);
  });
});
