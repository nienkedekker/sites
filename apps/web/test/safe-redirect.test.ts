import { describe, expect, it } from "vitest";
import { getSafeRedirectUrl } from "@/utils/auth/safe-redirect";

describe("getSafeRedirectUrl", () => {
  it("allows paths on this site", () => {
    expect(getSafeRedirectUrl("/year/2024")).toBe("/year/2024");
    expect(getSafeRedirectUrl("/create")).toBe("/create");
    expect(getSafeRedirectUrl("/search?q=dune")).toBe("/search?q=dune");
  });

  it("falls back home without a redirect", () => {
    expect(getSafeRedirectUrl(null)).toBe("/");
    expect(getSafeRedirectUrl("")).toBe("/");
  });

  it("never sends you to another site", () => {
    expect(getSafeRedirectUrl("https://evil.example")).toBe("/");
    expect(getSafeRedirectUrl("//evil.example")).toBe("/");
    expect(getSafeRedirectUrl("/\\evil.example")).toBe("/");
    expect(getSafeRedirectUrl("javascript:alert(1)")).toBe("/");
  });
});
