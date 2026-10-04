import { describe, expect, it } from "vitest";
import { isProtectedPathname } from "@/utils/supabase/middleware";

describe("isProtectedPathname", () => {
  it("guards the protected pages and what's under them", () => {
    expect(isProtectedPathname("/create")).toBe(true);
    expect(isProtectedPathname("/export")).toBe(true);
    expect(isProtectedPathname("/create/anything")).toBe(true);
    expect(isProtectedPathname("/recs")).toBe(true);
  });

  it("matches whole path segments only", () => {
    expect(isProtectedPathname("/createfoo")).toBe(false);
    expect(isProtectedPathname("/exports")).toBe(false);
    expect(isProtectedPathname("/about")).toBe(false);
  });

  it("leaves the download route to answer its own 401", () => {
    expect(isProtectedPathname("/export/download")).toBe(false);
  });
});
