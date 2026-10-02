import { describe, expect, it } from "vitest";
import { formatCount, formatDate } from "../src/format";
import { niceScale } from "../src/media-chart";

describe("formatCount", () => {
  it("groups thousands with commas", () => {
    expect(formatCount(12131)).toBe("12,131");
    expect(formatCount(7)).toBe("7");
  });
});

describe("formatDate", () => {
  it("writes dates the US way, in UTC", () => {
    const lateEvening = new Date("2026-10-02T23:30:00Z");

    expect(
      formatDate(lateEvening, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    ).toBe("October 2, 2026");
    expect(formatDate(lateEvening, { month: "short", day: "numeric" })).toBe(
      "Oct 2"
    );
  });
});

describe("niceScale", () => {
  it("rounds the axis up to the next 5", () => {
    expect(niceScale(12)).toEqual({ top: 15, ticks: [0, 5, 10, 15] });
    expect(niceScale(30)).toEqual({
      top: 30,
      ticks: [0, 5, 10, 15, 20, 25, 30],
    });
  });

  it("steps by 10 above 30", () => {
    expect(niceScale(31)).toEqual({ top: 40, ticks: [0, 10, 20, 30, 40] });
  });

  it("keeps one step for an empty chart", () => {
    expect(niceScale(0)).toEqual({ top: 5, ticks: [0, 5] });
  });
});
