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
    const { people } = computeStats([
      movie({ director: "Joel Coen, Ethan Coen" }),
      movie({ director: "Joel Coen" }),
      book({ author: "Neil Gaiman & Terry Pratchett" }),
      book({ author: "Greer Hendricks and Sarah Pekkanen" }),
    ]);

    expect(people).toContainEqual({
      name: "Joel Coen",
      count: 2,
      type: "Movie",
    });
    expect(people).toContainEqual({
      name: "Ethan Coen",
      count: 1,
      type: "Movie",
    });
    expect(people).toContainEqual({
      name: "Terry Pratchett",
      count: 1,
      type: "Book",
    });
    expect(people).toContainEqual({
      name: "Sarah Pekkanen",
      count: 1,
      type: "Book",
    });
  });

  it("keeps Christopher Nolan out of the top lists", () => {
    const { people, mostReread } = computeStats([
      movie({ title: "Inception", director: "Christopher Nolan", redo: true }),
      movie({ title: "Inception", director: "Christopher Nolan", redo: true }),
      movie({ title: "Inception", director: "Christopher Nolan" }),
    ]);

    expect(people.map((person) => person.name)).not.toContain(
      "Christopher Nolan",
    );
    expect(mostReread).toEqual([]);
  });

  it("sorts people by count, then name, and keeps the top ten", () => {
    const items = Array.from({ length: 12 }, (_, i) =>
      book({ author: `Author ${String.fromCharCode(76 - i)}` }),
    );
    items.push(book({ author: "Author Z" }), book({ author: "Author Z" }));

    const { people } = computeStats(items);

    expect(people).toHaveLength(10);
    expect(people[0]).toMatchObject({ name: "Author Z", count: 2 });
    expect(people[1].name).toBe("Author A");
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
