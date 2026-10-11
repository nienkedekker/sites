import { describe, expect, it } from "vitest";
import { isProtectedPathname } from "@/utils/supabase/middleware";

describe("isProtectedPathname", () => {
  it("guards the protected pages and what's under them", () => {
    expect(isProtectedPathname("/create")).toBe(true);
    expect(isProtectedPathname("/settings")).toBe(true);
    expect(isProtectedPathname("/create/anything")).toBe(true);
    expect(isProtectedPathname("/discover")).toBe(true);
    expect(isProtectedPathname("/up-next")).toBe(true);
    expect(isProtectedPathname("/nanami/downloads")).toBe(true);
    expect(isProtectedPathname("/discover/for-you")).toBe(true);
  });

  it("matches whole path segments only", () => {
    expect(isProtectedPathname("/createfoo")).toBe(false);
    expect(isProtectedPathname("/settingsfoo")).toBe(false);
    expect(isProtectedPathname("/about")).toBe(false);
  });

  it("leaves the download route to answer its own 401", () => {
    expect(isProtectedPathname("/settings/download")).toBe(false);
  });
});
