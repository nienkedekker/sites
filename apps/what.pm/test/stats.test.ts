import { describe, expect, it, vi } from "vitest";
import { book, movie, show } from "./items";

vi.mock("@/utils/supabase/public", () => ({ supabasePublic: {} }));
vi.mock("next/cache", () => ({
  unstable_cache: <T>(fn: T) => fn,
}));

const { computeStats } = await import("@/utils/data/stats");

describe("computeStats", () => {
  it("lists every year from the first to the last, gaps included", () => {
    const { years } = computeStats([
      book({ belongs_to_year: 2020 }),
      book({ belongs_to_year: 2022 }),
    ]);

    expect(years.map((y) => [y.year, y.entries.length])).toEqual([
      [2020, 1],
      [2021, 0],
      [2022, 1],
    ]);
  });

  it("orders a year's entries books, movies, shows, then by log date", () => {
    const { years } = computeStats([
      show({ title: "Show", created_at: "2026-01-01T00:00:00Z" }),
      book({ title: "Later book", created_at: "2026-05-01T00:00:00Z" }),
      movie({ title: "Movie", created_at: "2026-01-01T00:00:00Z" }),
      book({ title: "Earlier book", created_at: "2026-02-01T00:00:00Z" }),
    ]);

    expect(years[0].entries.map((entry) => entry.title)).toEqual([
      "Earlier book",
      "Later book",
      "Movie",
      "Show",
    ]);
  });

  it("counts co-authors and co-directors separately", () => {
    const { authors, directors } = computeStats([
      movie({ director: "Joel Coen, Ethan Coen" }),
      movie({ director: "Joel Coen" }),
      book({ author: "Neil Gaiman & Terry Pratchett" }),
      book({ author: "Greer Hendricks and Sarah Pekkanen" }),
    ]);

    expect(directors).toContainEqual({
      name: "Joel Coen",
      count: 2,
      type: "Movie",
    });
    expect(directors).toContainEqual({
      name: "Ethan Coen",
      count: 1,
      type: "Movie",
    });
    expect(authors).toContainEqual({
      name: "Terry Pratchett",
      count: 1,
      type: "Book",
    });
    expect(authors).toContainEqual({
      name: "Sarah Pekkanen",
      count: 1,
      type: "Book",
    });
  });

  it("lists someone who writes and directs in both, with separate counts", () => {
    const { authors, directors } = computeStats([
      book({ author: "Alex Garland" }),
      movie({ director: "Alex Garland" }),
      movie({ director: "Alex Garland" }),
    ]);

    expect(authors).toEqual([{ name: "Alex Garland", count: 1, type: "Book" }]);
    expect(directors).toEqual([
      { name: "Alex Garland", count: 2, type: "Movie" },
    ]);
  });

  it("keeps Christopher Nolan out of the top lists", () => {
    const { directors, mostReread } = computeStats([
      movie({ title: "Inception", director: "Christopher Nolan", redo: true }),
      movie({ title: "Inception", director: "Christopher Nolan", redo: true }),
      movie({ title: "Inception", director: "Christopher Nolan" }),
    ]);

    expect(directors.map((person) => person.name)).not.toContain(
      "Christopher Nolan",
    );
    expect(mostReread).toEqual([]);
  });

  it("sorts people by count, then name, and keeps the top ten", () => {
    const items = Array.from({ length: 12 }, (_, i) =>
      book({ author: `Author ${String.fromCharCode(76 - i)}` }),
    );
    items.push(book({ author: "Author Z" }), book({ author: "Author Z" }));

    const { authors, directors } = computeStats(items);

    expect(authors).toHaveLength(10);
    expect(authors[0]).toMatchObject({ name: "Author Z", count: 2 });
    expect(authors[1].name).toBe("Author A");
    expect(directors).toEqual([]);
  });

  it("groups rereads by title and counts the most-seen season", () => {
    const { mostReread } = computeStats([
      book({ title: "Nona the Ninth" }),
      book({ title: "nona the ninth ", redo: true }),
      book({ title: "Nona the Ninth", redo: true }),
      show({ title: "The Leftovers", season: 1 }),
      show({ title: "The Leftovers", season: 1, redo: true }),
      show({ title: "The Leftovers", season: 2 }),
      book({ title: "Read once" }),
    ]);

    expect(mostReread).toEqual([
      { title: "Nona the Ninth", type: "Book", times: 3 },
      { title: "The Leftovers", type: "Show", times: 2 },
    ]);
  });

  it("counts each logged movie and season once per genre", () => {
    const { genres } = computeStats([
      movie({ genres: ["Drama", "Science Fiction", "Adventure"] }),
      movie({ genres: ["Drama", "Action", "Adventure"] }),
      show({ season: 1, genres: ["Drama", "Science Fiction", "Fantasy"] }),
      show({ season: 2, genres: ["Drama", "Science Fiction", "Fantasy"] }),
      book({ genres: ["Fantasy"] }),
    ]);

    expect(genres.books).toEqual([{ name: "Fantasy", count: 1 }]);
    expect(genres.screen).toEqual([
      { name: "Drama", count: 4 },
      { name: "Sci-Fi & Fantasy", count: 3 },
      { name: "Action & Adventure", count: 2 },
    ]);
  });

  it("breaks a book genre down by main subgenre, with tags apart", () => {
    const { genres } = computeStats([
      book({ genres: ["Literary Fiction"], subgenres: ["Satire"] }),
      book({
        genres: ["Literary Fiction"],
        subgenres: ["Psychological Fiction", "Satire", "Queer Fiction"],
      }),
      book({
        genres: ["Literary Fiction"],
        subgenres: ["Psychological Fiction"],
      }),
      book({ genres: ["Literary Fiction"] }),
      book({ genres: ["Fantasy"] }),
    ]);

    expect(genres.books).toEqual([
      {
        name: "Literary Fiction",
        count: 4,
        parts: [
          { name: "Psychological Fiction", count: 2 },
          { name: "Satire", count: 1 },
          { name: "Other", count: 1 },
        ],
        tags: [{ name: "Queer Fiction", count: 1 }],
      },
      { name: "Fantasy", count: 1 },
    ]);
  });

  it("only charts months for years logged as they happened", () => {
    const { monthRows } = computeStats([
      book({ belongs_to_year: 2019, created_at: "2024-01-01T00:00:00Z" }),
      book({ belongs_to_year: 2026, created_at: "2026-04-10T00:00:00Z" }),
    ]);

    expect(monthRows.map((row) => row.year)).toEqual([2026]);
    expect(monthRows[0].months[3]).toMatchObject({
      books: 1,
      titles: [{ type: "Book" }],
    });
  });
});
