import { describe, expect, it } from "vitest";
import { barCentre, tooltipAlign } from "../src/tooltip";

describe("tooltipAlign", () => {
  it("pins tooltips in the outer thirds to the near edge", () => {
    expect(tooltipAlign(0.06)).toBe("left-0");
    expect(tooltipAlign(0.9)).toBe("right-0");
  });

  it("centres tooltips in the middle third", () => {
    expect(tooltipAlign(0.5)).toBe("left-1/2 -translate-x-1/2");
  });
});

describe("barCentre", () => {
  it("splits twelve bars into four per third", () => {
    const aligns = Array.from({ length: 12 }, (_, i) =>
      tooltipAlign(barCentre(i, 12))
    );
    expect(aligns.filter((a) => a === "left-0")).toHaveLength(4);
    expect(aligns.filter((a) => a === "right-0")).toHaveLength(4);
  });
});
