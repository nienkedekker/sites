import { describe, expect, it } from "vitest";
import { scrollSwell, swellLine, swellWords } from "../src/swell";

const letters = Array.from({ length: 8 }, (_, i) => ({
  x: 10 + i * 20,
  width: 18,
  advance: 20,
}));
const end = (line: typeof letters, t: ReturnType<typeof swellLine>) => {
  const last = line.length - 1;
  return line[last].x + t[last].translate + line[last].advance * t[last].scale;
};

describe("swellLine", () => {
  it("leaves letters alone when there is no swell", () => {
    for (const t of swellLine(letters, 80, 0, 16)) {
      expect(t.translate).toBeCloseTo(0);
      expect(t.scale).toBeCloseTo(1);
    }
  });

  it("widens the letters under the pointer and narrows the rest", () => {
    const t = swellLine(letters, letters[2].x + 9, 1, 16);
    expect(t[2].scale).toBeGreaterThan(1.1);
    expect(t[7].scale).toBeLessThan(1);
  });

  it("keeps the line's start and width", () => {
    const t = swellLine(letters, 70, 1, 16);
    expect(t[0].translate).toBeCloseTo(0);
    expect(end(letters, t)).toBeCloseTo(
      end(letters, swellLine(letters, 70, 0, 16))
    );
  });
});

describe("swellWords", () => {
  it("splits text into words of letters", () => {
    expect(swellWords("Not in  the log")).toEqual([
      ["N", "o", "t"],
      ["i", "n"],
      ["t", "h", "e"],
      ["l", "o", "g"],
    ]);
  });
});

describe("scrollSwell", () => {
  it("runs from the start of the line at the bottom to the end at the top", () => {
    expect(scrollSwell(800, 800)).toEqual({ progress: 0, amount: 0 });
    expect(scrollSwell(400, 800)).toEqual({ progress: 0.5, amount: 1 });
    expect(scrollSwell(0, 800).amount).toBe(0);
  });

  it("is off outside the viewport", () => {
    expect(scrollSwell(-50, 800).amount).toBe(0);
    expect(scrollSwell(900, 800).amount).toBe(0);
  });

  it("fades in near the edges", () => {
    const { amount } = scrollSwell(760, 800);
    expect(amount).toBeGreaterThan(0);
    expect(amount).toBeLessThan(1);
  });
});
