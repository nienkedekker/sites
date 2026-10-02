import { describe, expect, it } from "vitest";
import {
  cleanTitle,
  pickMovie,
  pickShow,
  titleScore,
  type TmdbMovie,
  type TmdbShow,
} from "@/scripts/matching";
import { movie, show } from "./items";

describe("cleanTitle", () => {
  it("drops how I watched it and bracketed notes", () => {
    expect(cleanTitle("Prometheus IMAX 3D")).toBe("Prometheus");
    expect(cleanTitle("Blade Runner (The Final Cut)")).toBe("Blade Runner");
    expect(cleanTitle("Slumdog Millionaire (Q&A)")).toBe("Slumdog Millionaire");
  });
});

describe("titleScore", () => {
  it("scores the same title highest", () => {
    expect(titleScore("A Feast For Crows", "A Feast for Crows")).toBe(2);
  });

  it("accepts a source that only adds a subtitle", () => {
    expect(titleScore("Wolf Hall", "Wolf Hall: A Novel")).toBe(1);
  });

  it("doesn't let a logged subtitle match the first book", () => {
    expect(titleScore("Mistborn: The Hero of Ages", "Mistborn")).toBe(0);
  });

  it("ignores a possessive prefix", () => {
    expect(titleScore("Runaways", "Marvel's Runaways")).toBe(2);
    expect(titleScore("Jack Ryan", "Tom Clancy’s Jack Ryan")).toBe(2);
  });

  it("checks every candidate, like a movie's original title", () => {
    expect(titleScore("Festen", "The Celebration", "Festen")).toBe(2);
  });
});

describe("pickMovie", () => {
  const result = (id: number, title: string, date: string): TmdbMovie => ({
    id,
    title,
    release_date: date,
  });

  it("prefers the full title over one with a subtitle", () => {
    const picked = pickMovie(
      [
        result(1, "Dune: Part Two", "2024-02-27"),
        result(2, "Dune", "2021-09-15"),
      ],
      movie({ title: "Dune", published_year: 2021 }),
    );

    expect(picked?.id).toBe(2);
  });

  it("picks the release from the right year", () => {
    const results = [
      result(1, "Dune", "1984-12-14"),
      result(2, "Dune", "2021-09-15"),
    ];

    expect(
      pickMovie(results, movie({ title: "Dune", published_year: 1984 }))?.id,
    ).toBe(1);
    expect(
      pickMovie(results, movie({ title: "Dune", published_year: 2021 }))?.id,
    ).toBe(2);
  });

  it("leaves a year that's off for the director check", () => {
    const picked = pickMovie(
      [result(958196, "Inside", "2023-03-10")],
      movie({ title: "Inside", director: "Bo Burnham", published_year: 2021 }),
    );

    expect(picked).toBeNull();
  });

  it("matches a movie logged under its original title", () => {
    const picked = pickMovie(
      [
        {
          id: 1,
          title: "The Hunt",
          original_title: "Jagten",
          release_date: "2012-01-10",
        },
      ],
      movie({ title: "Jagten", published_year: 2012 }),
    );

    expect(picked?.id).toBe(1);
  });
});

describe("pickShow", () => {
  const result = (id: number, name: string, date: string): TmdbShow => ({
    id,
    name,
    first_air_date: date,
  });

  it("doesn't confuse a show with its spin-off", () => {
    const picked = pickShow(
      [
        result(1, "The Expanse: One Ship", "2022-01-01"),
        result(2, "The Expanse", "2015-12-14"),
      ],
      show({ title: "The Expanse", season: 6, published_year: 2022 }),
    );

    expect(picked?.id).toBe(2);
  });

  it("matches a first season to the show that started that year", () => {
    const picked = pickShow(
      [
        result(1, "Runaways", "2012-01-01"),
        result(2, "Marvel's Runaways", "2017-11-21"),
        result(3, "The Runaways", "1978-04-01"),
      ],
      show({ title: "Runaways", season: 1, published_year: 2017 }),
    );

    expect(picked?.id).toBe(2);
  });

  it("skips shows that started after the season aired", () => {
    const picked = pickShow(
      [
        result(1, "The Office", "2005-03-24"),
        result(2, "The Office", "2001-07-09"),
      ],
      show({ title: "The Office (UK)", season: 1, published_year: 2001 }),
    );

    expect(picked?.id).toBe(2);
  });

  it("goes with TMDB's order for later seasons", () => {
    const picked = pickShow(
      [
        result(1, "Shameless", "2011-01-09"),
        result(2, "Shameless", "2004-01-13"),
      ],
      show({ title: "Shameless", season: 5, published_year: 2015 }),
    );

    expect(picked?.id).toBe(1);
  });

  it("returns null when nothing fits", () => {
    expect(
      pickShow(
        [result(1, "Something Else", "2010-01-01")],
        show({ title: "Severance", season: 1, published_year: 2022 }),
      ),
    ).toBeNull();
  });
});
