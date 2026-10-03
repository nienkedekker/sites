import { describe, expect, it } from "vitest";
import { externalProps } from "../src/external";
import { formatPlural } from "../src/format";
import { heatShade } from "../src/heatmap";
import { describeCounts } from "../src/series";

describe("formatPlural", () => {
  it("picks the singular only for one", () => {
    expect(formatPlural(1, "post")).toBe("1 post");
    expect(formatPlural(0, "post")).toBe("0 posts");
    expect(formatPlural(1204, "post")).toBe("1,204 posts");
    expect(formatPlural(2, "TV season")).toBe("2 TV seasons");
    expect(formatPlural(3, "child", "children")).toBe("3 children");
  });
});

describe("externalProps", () => {
  it("opens only web links in a new tab", () => {
    expect(externalProps("https://x.com")).toEqual({
      target: "_blank",
      rel: "noopener noreferrer",
    });
    expect(externalProps("/now")).toEqual({});
    expect(externalProps("mailto:hi@example.com")).toEqual({});
  });
});

describe("heatShade", () => {
  it("leaves empty cells unshaded", () => {
    expect(heatShade(0, 10)).toBeUndefined();
  });

  it("gives the maximum the darkest step", () => {
    expect(heatShade(10, 10)).toContain("100%");
    expect(heatShade(1, 10)).toContain("18%");
  });

  it("lifts small counts on a log scale", () => {
    expect(heatShade(10, 1000, "linear")).toContain("18%");
    expect(heatShade(10, 1000, "log")).toContain("38%");
  });
});

describe("describeCounts", () => {
  const counts = { books: 3, movies: 0, shows: 1 };

  it("lists every series by default", () => {
    expect(describeCounts(counts)).toBe("3 books, 0 movies, 1 TV seasons");
  });

  it("can drop the empty ones", () => {
    expect(describeCounts(counts, { skipZero: true })).toBe("3 books, 1 TV seasons");
  });
});
