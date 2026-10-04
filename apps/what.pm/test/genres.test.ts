import { describe, expect, it } from "vitest";
import { book, movie, show } from "./items";
import { genrePath, genreSlug, itemsInGenre } from "@/utils/data/genres";

describe("genre pages", () => {
  it("turns genre names into readable slugs", () => {
    expect(genreSlug("Sci-Fi & Fantasy")).toBe("sci-fi-and-fantasy");
    expect(genreSlug("17th–19th Century")).toBe("17th-19th-century");
    expect(genrePath("Literary Fiction", "Coming-of-Age")).toBe(
      "/genres/literary-fiction/coming-of-age",
    );
  });

  it("finds a genre across books and screen, newest first", () => {
    const items = [
      book({ title: "Old", genres: ["Thriller"], belongs_to_year: 2019 }),
      movie({ title: "New", genres: ["Thriller"], belongs_to_year: 2025 }),
      show({ title: "Other", genres: ["Drama"] }),
    ];

    const found = itemsInGenre(items, "thriller");
    expect(found?.genre).toBe("Thriller");
    expect(found?.items.map((item) => item.title)).toEqual(["New", "Old"]);
  });

  it("uses the combined screen genres", () => {
    const found = itemsInGenre(
      [movie({ genres: ["Science Fiction"] }), book({ genres: ["Fantasy"] })],
      "sci-fi-and-fantasy",
    );
    expect(found?.items).toHaveLength(1);
  });

  it("finds a main subgenre, a tag, or the books with no subgenre", () => {
    const items = [
      book({
        title: "Kawakami",
        genres: ["Literary Fiction"],
        subgenres: ["Psychological Fiction", "Japanese Fiction"],
      }),
      book({ title: "Untagged", genres: ["Literary Fiction"] }),
      book({
        title: "Second",
        genres: ["Literary Fiction"],
        subgenres: ["Satire", "Psychological Fiction"],
      }),
    ];

    expect(
      itemsInGenre(items, "literary-fiction", "psychological-fiction")
        ?.subgenre,
    ).toBe("Psychological Fiction");
    expect(
      itemsInGenre(items, "literary-fiction", "japanese-fiction")?.items[0]
        .title,
    ).toBe("Kawakami");
    expect(
      itemsInGenre(items, "literary-fiction", "other")?.items.map(
        (item) => item.title,
      ),
    ).toEqual(["Untagged"]);
    expect(
      itemsInGenre(items, "literary-fiction", "psychological-fiction")?.items,
    ).toHaveLength(1);
    expect(itemsInGenre(items, "literary-fiction", "classics")).toBeNull();
    expect(itemsInGenre(items, "romance")).toBeNull();
  });
});
