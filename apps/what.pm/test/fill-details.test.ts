import { describe, expect, it } from "vitest";
import { needOf, patchFor } from "@/utils/data/fill-details";
import { book, movie } from "./items";

describe("needOf", () => {
  it("asks for a match first, then a length, then genres", () => {
    expect(needOf(book())).toBe("match");
    expect(needOf(book({ external_id: "/works/OL1W" }))).toBe("length");
    expect(needOf(book({ external_id: "/works/OL1W", pages: 300 }))).toBe(
      "genres",
    );
    expect(
      needOf(
        book({ external_id: "/works/OL1W", pages: 300, genres: ["Fantasy"] }),
      ),
    ).toBeNull();
  });

  it("wants a runtime for films, not pages", () => {
    expect(needOf(movie({ external_id: "12", runtime_minutes: null }))).toBe(
      "length",
    );
  });
});

describe("patchFor", () => {
  it("fills only what's empty", () => {
    const item = book({ pages: 800, genres: [] });
    expect(
      patchFor(item, { pages: 769, genres: ["Fantasy"] }, "/works/OL81599W"),
    ).toEqual({ external_id: "/works/OL81599W", genres: ["Fantasy"] });
  });

  it("keeps an existing link", () => {
    const item = book({ external_id: "/works/OL1W" });
    expect(patchFor(item, { pages: 300 }, "/works/OL2W")).toEqual({
      pages: 300,
    });
  });

  it("returns null when there's nothing new", () => {
    const item = book({ external_id: "/works/OL1W", pages: 300 });
    expect(patchFor(item, { pages: 320, genres: [] })).toBeNull();
  });
});
