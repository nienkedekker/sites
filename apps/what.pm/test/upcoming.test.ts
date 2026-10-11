import { describe, expect, it } from "vitest";
import { genresIn } from "@/utils/data/book-genres";
import {
  byMonth,
  favouriteGenres,
  isOut,
  matchesGenres,
  titleKey,
  toUpcoming,
  type HardcoverBook,
} from "@/utils/data/upcoming";

const raw: HardcoverBook = {
  id: 1,
  slug: "the-thrice-bound-fool",
  title: " The Thrice-Bound Fool ",
  release_date: "2026-10-13",
  users_count: 102,
  description: "A rogue returns.",
  cached_image: {
    url: "https://assets.hardcover.app/x.jpg",
    width: 600,
    height: 900,
  },
  cached_contributors: [
    { author: { name: "Christopher Buehlman" }, contribution: null },
    { author: { name: "Some Narrator" }, contribution: "Narrator" },
  ],
  cached_tags: {
    Genre: [{ tag: "Fantasy" }, { tag: "Fiction" }, { tag: "Epic Fantasy" }],
  },
};

describe("toUpcoming", () => {
  it("keeps what the page shows, with writers only and genres as the log names them", () => {
    expect(toUpcoming([raw])).toEqual([
      {
        id: 1,
        slug: "the-thrice-bound-fool",
        title: "The Thrice-Bound Fool",
        authors: ["Christopher Buehlman"],
        releaseDate: "2026-10-13",
        readers: 102,
        genres: ["Fantasy"],
        cover: {
          url: "https://assets.hardcover.app/x.jpg",
          width: 600,
          height: 900,
        },
        description: "A rogue returns.",
      },
    ]);
  });

  it("leaves out romance and romantasy, even alongside fantasy", () => {
    const books = toUpcoming([
      { ...raw, id: 1 },
      {
        ...raw,
        id: 2,
        cached_tags: { Genre: [{ tag: "Fantasy" }, { tag: "Romantasy" }] },
      },
      { ...raw, id: 3, cached_tags: { Genre: [{ tag: "Romance" }] } },
    ]);
    expect(books.map((book) => book.id)).toEqual([1]);
  });

  it("drops books without a title or date, and covers without a size", () => {
    const books = toUpcoming([
      { ...raw, title: null },
      { ...raw, id: 2, release_date: null },
      {
        ...raw,
        id: 3,
        cached_image: { url: "https://assets.hardcover.app/y.jpg" },
      },
    ]);
    expect(books.map((book) => book.id)).toEqual([3]);
    expect(books[0].cover).toBeNull();
  });

  it("shortens long descriptions at a word", () => {
    const [book] = toUpcoming([{ ...raw, description: "word ".repeat(200) }]);
    expect(book.description!.length).toBeLessThanOrEqual(601);
    expect(book.description).toMatch(/word…$/);
  });
});

describe("genresIn", () => {
  it("finds every genre the tags name", () => {
    expect(
      genresIn(["Science Fiction", "LGBTQ", "Horror", "Literary Fiction"]),
    ).toEqual(["Science Fiction", "Horror", "Literary Fiction"]);
    expect(genresIn(["Historical Fiction", "History"])).toEqual([
      "Historical Fiction",
      "History",
    ]);
  });
});

describe("byMonth", () => {
  it("groups by month, by day within it, the most anticipated first on a day", () => {
    const books = toUpcoming([
      { ...raw, id: 1, release_date: "2026-11-03", users_count: 10 },
      { ...raw, id: 2, release_date: "2026-10-27", users_count: 5 },
      { ...raw, id: 3, release_date: "2026-11-03", users_count: 90 },
    ]);
    expect(
      byMonth(books).map(({ month, books }) => [month, books.map((b) => b.id)]),
    ).toEqual([
      ["2026-10", [2]],
      ["2026-11", [3, 1]],
    ]);
  });
});

describe("favouriteGenres", () => {
  it("ranks the genres read most", () => {
    expect(
      favouriteGenres(
        [["Horror"], ["Fantasy"], ["Horror"], ["Literary Fiction"], []],
        2,
      ),
    ).toEqual(["Horror", "Fantasy"]);
  });
});

describe("matchesGenres", () => {
  it("shows everything when no genre is picked", () => {
    const [book] = toUpcoming([raw]);
    expect(matchesGenres(book, new Set())).toBe(true);
    expect(matchesGenres(book, new Set(["Fantasy"]))).toBe(true);
    expect(matchesGenres(book, new Set(["Horror"]))).toBe(false);
  });
});

describe("recent books", () => {
  const books = toUpcoming([
    { ...raw, id: 1, release_date: "2026-09-02", users_count: 40 },
    { ...raw, id: 2, release_date: "2026-10-11", users_count: 5 },
    { ...raw, id: 3, release_date: "2026-10-12", users_count: 90 },
  ]);

  it("counts a book out from its release day", () => {
    expect(books.map((book) => isOut(book, "2026-10-11"))).toEqual([
      true,
      true,
      false,
    ]);
  });

  it("lists books that are out newest first", () => {
    const out = books.filter((book) => isOut(book, "2026-10-11"));
    expect(
      byMonth(out, true).map(({ month, books }) => [
        month,
        books.map((b) => b.id),
      ]),
    ).toEqual([
      ["2026-10", [2]],
      ["2026-09", [1]],
    ]);
  });
});

describe("titleKey", () => {
  it("matches titles with and without a subtitle", () => {
    expect(titleKey("Ninth House: A Novel")).toBe(titleKey("Ninth House"));
    expect(titleKey("The Fisherman (Hardcover)")).toBe(titleKey("Fisherman"));
  });
});
