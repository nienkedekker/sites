import { afterEach, describe, expect, it, vi } from "vitest";
import { getCurrentYear, localDate } from "@/utils/formatters/date";

afterEach(() => {
  vi.useRealTimers();
});

describe("localDate", () => {
  it("gives the calendar date in Amsterdam", () => {
    expect(localDate(new Date("2026-02-28T23:30:00Z"))).toEqual({
      year: 2026,
      month: 3,
      day: 1,
    });
    expect(localDate(new Date("2026-07-15T12:00:00Z"))).toEqual({
      year: 2026,
      month: 7,
      day: 15,
    });
  });
});

describe("getCurrentYear", () => {
  it("turns over at midnight in Amsterdam, not in UTC", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-12-31T23:30:00Z"));
    expect(getCurrentYear()).toBe(2026);
    vi.setSystemTime(new Date("2025-12-31T22:30:00Z"));
    expect(getCurrentYear()).toBe(2025);
  });
});
