import { describe, expect, it } from "vitest";
import {
  dayIndex,
  dayOfYear,
  daysInYear,
  findAdaptations,
  normalizeTitle,
  paceYears,
  rereadRhythms,
  timeSpent,
} from "@/utils/data/patterns";
import type { TypedItem } from "@/types/shared";
import { book, movie, show } from "./items";

describe("dayOfYear", () => {
  it("counts from zero on January 1st", () => {
    expect(dayOfYear(new Date("2026-01-01T00:00:00Z"))).toBe(0);
    expect(dayOfYear(new Date("2026-02-01T00:00:00Z"))).toBe(31);
  });

  it("knows about leap years", () => {
    expect(daysInYear(2024)).toBe(366);
    expect(daysInYear(2026)).toBe(365);
    expect(dayOfYear(new Date("2024-12-31T12:00:00Z"))).toBe(365);
  });
});

describe("dayIndex", () => {
  it("uses the day the item was logged", () => {
    expect(dayIndex(book({ created_at: "2026-03-15T12:00:00Z" }), 2026)).toBe(
      73,
    );
  });

  it("puts items logged before the year on day one and after it on the last day", () => {
    expect(dayIndex(book({ created_at: "2025-12-30T12:00:00Z" }), 2026)).toBe(
      0,
    );
    expect(dayIndex(book({ created_at: "2027-01-02T12:00:00Z" }), 2026)).toBe(
      364,
    );
  });

  it("skips items without a usable log date", () => {
    expect(dayIndex(book({ created_at: null }), 2026)).toBeNull();
    expect(dayIndex(book({ created_at: "not a date" }), 2026)).toBeNull();
  });
});

describe("paceYears", () => {
  it("returns each year's log days in order, ignoring undated items", () => {
    const items = [
      book({ created_at: "2026-03-01T00:00:00Z" }),
      book({ created_at: "2026-01-05T00:00:00Z" }),
      book({ created_at: null }),
    ];
    const byYear = new Map<number, TypedItem[]>([[2026, items]]);

    expect(paceYears(byYear, [2026, 2025])).toEqual([
      { year: 2026, days: [4, 59] },
      { year: 2025, days: [] },
    ]);
  });
});

describe("rereadRhythms", () => {
  const none = new Set<string>();

  it("only includes rereads spread over more than one year", () => {
    const rhythms = rereadRhythms(
      [
        book({ title: "Same year", belongs_to_year: 2020 }),
        book({ title: "Same year", belongs_to_year: 2020, redo: true }),
        book({ title: "Never reread", belongs_to_year: 2018 }),
        book({ title: "Never reread", belongs_to_year: 2022 }),
        book({ title: "Gideon the Ninth", belongs_to_year: 2020 }),
        book({ title: "Gideon the Ninth", belongs_to_year: 2022, redo: true }),
      ],
      2026,
      none,
    );

    expect(rhythms.map((rhythm) => rhythm.title)).toEqual(["Gideon the Ninth"]);
  });

  it("works out the usual gap between reads", () => {
    const [rhythm] = rereadRhythms(
      [2010, 2012, 2024].map((year) =>
        book({ title: "A Game of Thrones", belongs_to_year: year, redo: true }),
      ),
      2026,
      none,
    );

    expect(rhythm).toMatchObject({ years: [2010, 2012, 2024], every: 7 });
  });

  it("marks a title due once the usual gap has passed, but not after the habit lapsed", () => {
    const rhythm = (years: number[]) =>
      rereadRhythms(
        years.map((year) =>
          book({ title: "Wolf Hall", belongs_to_year: year, redo: true }),
        ),
        2026,
        none,
      )[0];

    // every 2 years, last read 2022: 4 years is still within twice the gap
    expect(rhythm([2020, 2022]).due).toBe(true);
    // every 2 years, last read 2025: not yet
    expect(rhythm([2023, 2025]).due).toBe(false);
    // every 2 years, last read 2009: the habit has long lapsed
    expect(rhythm([2007, 2009]).due).toBe(false);
  });

  it("treats each season of a show separately", () => {
    const rhythms = rereadRhythms(
      [
        show({ title: "The Leftovers", season: 1, belongs_to_year: 2016 }),
        show({
          title: "The Leftovers",
          season: 1,
          belongs_to_year: 2021,
          redo: true,
        }),
        show({ title: "The Leftovers", season: 2, belongs_to_year: 2017 }),
      ],
      2026,
      none,
    );

    expect(rhythms).toHaveLength(1);
    expect(rhythms[0]).toMatchObject({ season: 1, years: [2016, 2021] });
  });

  it("ranks titles by how often I came back, then by the latest read", () => {
    const reads = (title: string, years: number[]) =>
      years.map((year) => book({ title, belongs_to_year: year, redo: true }));
    const rhythms = rereadRhythms(
      [
        ...reads("Twice, long ago", [2010, 2012]),
        ...reads("Three times", [2015, 2018, 2021]),
        ...reads("Twice, recently", [2022, 2024]),
      ],
      2026,
      none,
    );

    expect(rhythms.map((rhythm) => rhythm.title)).toEqual([
      "Three times",
      "Twice, recently",
      "Twice, long ago",
    ]);
  });

  it("leaves out hidden people", () => {
    const rhythms = rereadRhythms(
      [2010, 2014].map((year) =>
        movie({
          title: "Inception",
          director: "Christopher Nolan",
          belongs_to_year: year,
          redo: true,
        }),
      ),
      2026,
      new Set(["Christopher Nolan"]),
    );

    expect(rhythms).toEqual([]);
  });
});

describe("normalizeTitle", () => {
  it("ignores case, accents, punctuation and a leading article", () => {
    expect(normalizeTitle("The Lives of Others")).toBe("lives of others");
    expect(normalizeTitle("Amélie")).toBe("amelie");
    expect(normalizeTitle("Dune: Part Two")).toBe("dune part two");
  });
});

describe("findAdaptations", () => {
  it("pairs a book with its adaptation by author and title", () => {
    const pairs = findAdaptations([
      book({ title: "Dune", author: "Frank Herbert", belongs_to_year: 2015 }),
      movie({
        title: "Dune: Part Two",
        based_on: "Frank Herbert",
        belongs_to_year: 2024,
      }),
    ]);

    expect(pairs).toEqual([
      {
        book: {
          title: "Dune",
          author: "Frank Herbert",
          year: 2015,
          before: false,
        },
        screen: {
          title: "Dune: Part Two",
          type: "Movie",
          year: 2024,
          before: false,
        },
      },
    ]);
  });

  it("matches names that only differ in apostrophes", () => {
    const pairs = findAdaptations([
      book({ title: "Hamnet", author: "Maggie O’Farrell" }),
      movie({ title: "Hamnet", based_on: "Maggie O'Farrell" }),
    ]);

    expect(pairs).toHaveLength(1);
  });

  it("needs the same author, not just the same title", () => {
    const pairs = findAdaptations([
      book({ title: "The Stranger", author: "Albert Camus" }),
      show({ title: "The Stranger", based_on: "Harlan Coben" }),
    ]);

    expect(pairs).toEqual([]);
  });

  it("pairs a book with its film's parts, but not with the next book's film", () => {
    const pairs = findAdaptations([
      book({ title: "The Hunger Games", author: "Suzanne Collins" }),
      book({
        title: "The Hunger Games: Mockingjay",
        author: "Suzanne Collins",
      }),
      movie({
        title: "The Hunger Games: Catching Fire",
        based_on: "Suzanne Collins",
      }),
      movie({
        title: "The Hunger Games: Mockingjay – Part 1",
        based_on: "Suzanne Collins",
      }),
    ]);

    expect(pairs.map((pair) => [pair.book.title, pair.screen.title])).toEqual([
      ["The Hunger Games: Mockingjay", "The Hunger Games: Mockingjay – Part 1"],
    ]);
  });

  it("ignores bracketed alternate titles", () => {
    const pairs = findAdaptations([
      book({ title: "Let The Right One In", author: "John Ajvide Lindqvist" }),
      movie({
        title: "Let The Right One In (Låt den rätte komma in)",
        based_on: "John Ajvide Lindqvist",
      }),
    ]);

    expect(pairs).toHaveLength(1);
  });

  it("doesn't pair sequels, prefixes or screens without a source", () => {
    const pairs = findAdaptations([
      book({ title: "Dune Messiah", author: "Frank Herbert" }),
      movie({ title: "Dune: Part Two", based_on: "Frank Herbert" }),
      book({ title: "It", author: "Stephen King" }),
      movie({ title: "It Follows", based_on: null }),
      movie({ title: "It", based_on: null }),
    ]);

    expect(pairs).toEqual([]);
  });

  it("keeps the first year I read and watched each", () => {
    const [pair] = findAdaptations([
      book({ title: "Dune", author: "Frank Herbert", belongs_to_year: 2019 }),
      book({ title: "Dune", author: "Frank Herbert", belongs_to_year: 2015 }),
      movie({
        title: "Dune",
        based_on: "Frank Herbert",
        belongs_to_year: 2021,
      }),
      movie({
        title: "Dune",
        based_on: "Frank Herbert",
        belongs_to_year: 2023,
      }),
    ]);

    expect(pair.book.year).toBe(2015);
    expect(pair.screen.year).toBe(2021);
  });

  it("notes when even the first log was a rewatch", () => {
    const [pair] = findAdaptations([
      book({
        title: "Generation Kill",
        author: "Evan Wright",
        belongs_to_year: 2009,
      }),
      show({
        title: "Generation Kill",
        based_on: "Evan Wright",
        belongs_to_year: 2024,
        redo: true,
      }),
    ]);

    expect(pair.book.before).toBe(false);
    expect(pair.screen.before).toBe(true);
  });

  it("dates a show from its first season, even when a later one was logged sooner", () => {
    const [pair] = findAdaptations([
      book({
        title: "A Game of Thrones",
        author: "George R.R. Martin",
        belongs_to_year: 2010,
      }),
      show({
        title: "Game of Thrones",
        based_on: "George R.R. Martin",
        season: 2,
        belongs_to_year: 2012,
      }),
      show({
        title: "Game of Thrones",
        based_on: "George R.R. Martin",
        season: 1,
        belongs_to_year: 2019,
        redo: true,
      }),
    ]);

    expect(pair.screen).toMatchObject({ year: 2019, before: true });
  });

  it("counts a first time if any log that year wasn't a redo", () => {
    const [pair] = findAdaptations([
      book({ title: "Dune", author: "Frank Herbert", belongs_to_year: 2011 }),
      movie({
        title: "Dune: Part One",
        based_on: "Frank Herbert",
        belongs_to_year: 2021,
        redo: true,
      }),
      movie({
        title: "Dune: Part One",
        based_on: "Frank Herbert",
        belongs_to_year: 2021,
      }),
    ]);

    expect(pair.screen).toMatchObject({ year: 2021, before: false });
  });
});

describe("timeSpent", () => {
  it("adds up pages and minutes, and how many items had them", () => {
    expect(
      timeSpent([
        book({ pages: 300 }),
        book({ pages: 450 }),
        book({ pages: null }),
        movie({ runtime_minutes: 120 }),
        show({ runtime_minutes: 540 }),
        show({ runtime_minutes: null }),
      ]),
    ).toEqual({
      pages: 750,
      booksWithPages: 2,
      books: 3,
      minutes: 660,
      screensWithRuntime: 2,
      screens: 3,
    });
  });
});
