import { describe, expect, it } from "vitest";
import { sourceOf } from "@/components/features/lists/item-source";

describe("sourceOf", () => {
  it("searches Goodreads for a book with its first author", () => {
    expect(
      sourceOf({
        itemtype: "Book",
        external_id: "/works/OL81599W",
        title: "The Talisman",
        author: "Stephen King, Peter Straub",
      })?.href,
    ).toBe(
      "https://www.goodreads.com/search?q=The%20Talisman%20Stephen%20King",
    );
  });

  it("links films to TMDB, and nothing without a match", () => {
    expect(
      sourceOf({
        itemtype: "Movie",
        external_id: "438631",
        title: "Dune",
        author: null,
      })?.href,
    ).toBe("https://www.themoviedb.org/movie/438631");
    expect(
      sourceOf({
        itemtype: "Movie",
        external_id: null,
        title: "Dune",
        author: null,
      }),
    ).toBeNull();
  });
});
