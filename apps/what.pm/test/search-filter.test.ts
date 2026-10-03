import { describe, expect, it } from "vitest";
import { ilikeAny } from "@/utils/data/search-filter";

describe("ilikeAny", () => {
  it("quotes the value so commas and parentheses stay in it", () => {
    expect(ilikeAny(["title", "author"], "Dune (2021), again")).toBe(
      'title.ilike."%Dune (2021), again%",author.ilike."%Dune (2021), again%"',
    );
  });

  it("matches LIKE wildcards literally", () => {
    expect(ilikeAny(["title"], "100%_")).toBe(
      String.raw`title.ilike."%100\\%\\_%"`,
    );
  });

  it("escapes quotes and backslashes for PostgREST", () => {
    expect(ilikeAny(["title"], String.raw`say "hi" \o/`)).toBe(
      String.raw`title.ilike."%say \"hi\" \\\\o/%"`,
    );
  });
});
