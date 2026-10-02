import { describe, expect, it } from "vitest";
import { itemCreationSchema } from "@/utils/schemas/validation";

const year = new Date().getFullYear();
const base = {
  title: "Dune",
  belongsToYear: year,
  publishedYear: 2021,
  redo: false,
};

const parse = (data: object) => itemCreationSchema.safeParse(data);

describe("itemCreationSchema", () => {
  it("accepts a book with an author", () => {
    expect(
      parse({ ...base, itemtype: "Book", author: "Frank Herbert" }).success,
    ).toBe(true);
  });

  it("requires an author for books", () => {
    expect(parse({ ...base, itemtype: "Book", author: "  " }).success).toBe(
      false,
    );
  });

  it("requires a director for movies", () => {
    expect(parse({ ...base, itemtype: "Movie" }).success).toBe(false);
    expect(
      parse({ ...base, itemtype: "Movie", director: "Denis Villeneuve" })
        .success,
    ).toBe(true);
  });

  it("requires a season between 1 and 50 for shows", () => {
    expect(parse({ ...base, itemtype: "Show" }).success).toBe(false);
    expect(parse({ ...base, itemtype: "Show", season: 0 }).success).toBe(false);
    expect(parse({ ...base, itemtype: "Show", season: 51 }).success).toBe(
      false,
    );
    expect(
      parse({ ...base, itemtype: "Show", season: 2, inProgress: true }).success,
    ).toBe(true);
  });

  it("keeps years between 1600 and ten years from now", () => {
    const movie = { ...base, itemtype: "Movie", director: "Someone" };
    expect(parse({ ...movie, publishedYear: 1599 }).success).toBe(false);
    expect(parse({ ...movie, publishedYear: 1600 }).success).toBe(true);
    expect(parse({ ...movie, publishedYear: year + 10 }).success).toBe(true);
    expect(parse({ ...movie, publishedYear: year + 11 }).success).toBe(false);
  });

  it("trims titles and rejects empty ones", () => {
    const result = parse({
      ...base,
      title: "  Dune  ",
      itemtype: "Book",
      author: "Frank Herbert",
    });
    expect(result.success && result.data.title).toBe("Dune");
    expect(
      parse({
        ...base,
        title: "   ",
        itemtype: "Book",
        author: "Frank Herbert",
      }).success,
    ).toBe(false);
  });

  it("rejects unknown item types", () => {
    expect(parse({ ...base, itemtype: "Podcast" }).success).toBe(false);
  });
});
