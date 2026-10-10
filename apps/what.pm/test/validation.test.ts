import { describe, expect, it } from "vitest";
import {
  dismissSchema,
  itemCreationSchema,
  pickKeysSchema,
  upNextSchema,
} from "@/utils/schemas/validation";

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

describe("upNextSchema", () => {
  const pick = { itemtype: "Show", externalId: "95396", title: "Severance" };

  it("takes ids in the shape each source uses", () => {
    expect(upNextSchema.safeParse(pick).success).toBe(true);
    expect(
      upNextSchema.safeParse({
        ...pick,
        itemtype: "Book",
        externalId: "/works/OL45246981W",
      }).success,
    ).toBe(true);
  });

  it("rejects ids that don't belong to the type", () => {
    expect(
      upNextSchema.safeParse({ ...pick, externalId: "95396/../../movie/1" })
        .success,
    ).toBe(false);
    expect(upNextSchema.safeParse({ ...pick, itemtype: "Book" }).success).toBe(
      false,
    );
    expect(
      upNextSchema.safeParse({ ...pick, itemtype: "Podcast" }).success,
    ).toBe(false);
  });

  it("caps the title length", () => {
    expect(
      upNextSchema.safeParse({ ...pick, title: "x".repeat(201) }).success,
    ).toBe(false);
  });
});

describe("dismissSchema", () => {
  it("only knows the two ways to dismiss a pick", () => {
    const pick = { itemtype: "Movie", externalId: "438631", title: "Dune" };
    expect(dismissSchema.safeParse({ ...pick, kind: "seen" }).success).toBe(
      true,
    );
    expect(dismissSchema.safeParse({ ...pick, kind: "hated" }).success).toBe(
      false,
    );
  });
});

describe("pickKeysSchema", () => {
  const key = { itemtype: "Book", externalId: "/works/OL45246981W" };

  it("takes a selection of one or more picks", () => {
    expect(pickKeysSchema.safeParse([key]).success).toBe(true);
    expect(
      pickKeysSchema.safeParse([key, { itemtype: "Show", externalId: "95396" }])
        .success,
    ).toBe(true);
  });

  it("turns down an empty selection or an unknown type", () => {
    expect(pickKeysSchema.safeParse([]).success).toBe(false);
    expect(
      pickKeysSchema.safeParse([{ itemtype: "Game", externalId: "1" }]).success,
    ).toBe(false);
  });
});
