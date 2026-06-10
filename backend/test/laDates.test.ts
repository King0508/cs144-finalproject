import { describe, expect, it } from "vitest";
import {
  laDateString,
  laWeekMonday,
  laMonthRange,
  laDateToEpochMs,
} from "../src/lib/laDates.js";

describe("laDates helpers", () => {
  it("formats the LA calendar date for an instant", () => {
    // 2026-06-09 06:30 UTC is still 2026-06-08 (23:30) in LA.
    const d = new Date("2026-06-09T06:30:00Z");
    expect(laDateString(d)).toBe("2026-06-08");
  });

  it("anchors the week on Monday", () => {
    // 2026-06-08 is a Monday; mid-week and Sunday resolve to the same Monday.
    expect(laWeekMonday(new Date("2026-06-08T12:00:00-07:00"))).toBe("2026-06-08");
    expect(laWeekMonday(new Date("2026-06-11T12:00:00-07:00"))).toBe("2026-06-08");
    expect(laWeekMonday(new Date("2026-06-14T12:00:00-07:00"))).toBe("2026-06-08");
    // Monday of the following week.
    expect(laWeekMonday(new Date("2026-06-15T12:00:00-07:00"))).toBe("2026-06-15");
  });

  it("computes inclusive-start / exclusive-end month bounds", () => {
    const june = laMonthRange(new Date("2026-06-15T12:00:00-07:00"));
    expect(june).toEqual({ start: "2026-06-01", endExclusive: "2026-07-01" });
    // December rolls over the year.
    const dec = laMonthRange(new Date("2026-12-15T12:00:00-08:00"));
    expect(dec).toEqual({ start: "2026-12-01", endExclusive: "2027-01-01" });
  });

  it("converts a YYYY-MM-DD to LA-local midnight epoch ms", () => {
    // June is PDT (UTC-7): LA midnight is 07:00 UTC.
    expect(laDateToEpochMs("2026-06-08")).toBe(Date.parse("2026-06-08T07:00:00Z"));
    // January is PST (UTC-8): LA midnight is 08:00 UTC.
    expect(laDateToEpochMs("2026-01-08")).toBe(Date.parse("2026-01-08T08:00:00Z"));
  });

  it("returns NaN for malformed input", () => {
    expect(Number.isNaN(laDateToEpochMs("not-a-date"))).toBe(true);
  });
});
