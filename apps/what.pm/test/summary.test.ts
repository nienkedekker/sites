import { describe, expect, it } from "vitest";
import {
  countByMonth,
  hasMonthlyData,
  monthIndex,
  summarizeYear,
} from "@/utils/data/summary";
import { book, movie, show } from "./items";

describe("monthIndex", () => {
  it("uses the month the item was logged in", () => {
    expect(monthIndex(book({ created_at: "2026-03-15T12:00:00Z" }), 2026)).toBe(
      2,
    );
  });

  it("puts items logged after the year in December and before it in January", () => {
    expect(monthIndex(book({ created_at: "2027-02-01T12:00:00Z" }), 2026)).toBe(
      11,
    );
    expect(monthIndex(book({ created_at: "2025-06-01T12:00:00Z" }), 2026)).toBe(
      0,
    );
  });

  it("goes by Amsterdam time, where midnight comes before it does in UTC", () => {
    expect(monthIndex(book({ created_at: "2026-02-28T23:30:00Z" }), 2026)).toBe(
      2,
    );
    expect(monthIndex(book({ created_at: "2026-06-30T22:30:00Z" }), 2026)).toBe(
      6,
    );
    expect(monthIndex(book({ created_at: "2025-12-31T23:30:00Z" }), 2026)).toBe(
      0,
    );
  });

  it("skips items without a log date", () => {
    expect(monthIndex(book({ created_at: null }), 2026)).toBeNull();
    expect(monthIndex(book({ created_at: "not a date" }), 2026)).toBeNull();
  });
});

describe("countByMonth", () => {
  it("counts each type per month", () => {
    const months = countByMonth(
      [
        book({ created_at: "2026-01-10T12:00:00Z" }),
        movie({ created_at: "2026-01-20T12:00:00Z" }),
        show({ created_at: "2026-05-01T12:00:00Z" }),
        book({ created_at: null }),
      ],
      2026,
    );

    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({ month: 1, books: 1, movies: 1, shows: 0 });
    expect(months[4]).toEqual({ month: 5, books: 0, movies: 0, shows: 1 });
  });
});

describe("summarizeYear", () => {
  it("counts the year's items and links to its page", () => {
    const summary = summarizeYear([book(), book(), movie(), show()], 2026);

    expect(summary.counts).toEqual({ books: 2, movies: 1, shows: 1 });
    expect(summary.url).toBe("https://www.what.pm/year/2026");
  });
});

describe("hasMonthlyData", () => {
  it("is true when at least half was logged during the year", () => {
    const items = [
      book({ created_at: "2026-03-01T12:00:00Z" }),
      book({ created_at: "2027-01-01T12:00:00Z" }),
    ];
    expect(hasMonthlyData(items, 2026)).toBe(true);
  });

  it("is false for years that were back-filled later", () => {
    const items = [
      book({ created_at: "2024-03-01T12:00:00Z" }),
      book({ created_at: "2024-03-01T12:00:00Z" }),
      book({ created_at: "2019-05-01T12:00:00Z" }),
    ];
    expect(hasMonthlyData(items, 2019)).toBe(false);
  });

  it("is false without any log dates", () => {
    expect(hasMonthlyData([book({ created_at: null })], 2026)).toBe(false);
  });
});
