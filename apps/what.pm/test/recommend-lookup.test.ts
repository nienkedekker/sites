import { describe, expect, it } from "vitest";
import { matchBook, matchScreen } from "@/utils/server/recommend-lookup";

describe("matchBook", () => {
  const docs = [
    {
      key: "/works/OL1W",
      title: "Piranesi",
      author_name: ["Susanna Clarke"],
      edition_count: 23,
    },
    {
      key: "/works/OL2W",
      title: "Piranesi: A Novel",
      author_name: ["Susanna Clarke"],
      edition_count: 40,
    },
    {
      key: "/works/OL3W",
      title: "Study Guide: Piranesi",
      author_name: ["SuperSummary"],
      edition_count: 2,
    },
  ];

  it("finds the work by title and author, the one with most editions", () => {
    expect(matchBook(docs, "Piranesi", "Susanna  Clarke")?.key).toBe(
      "/works/OL2W",
    );
  });

  it("finds nothing for a book that isn't there or by someone else", () => {
    expect(matchBook(docs, "Piranesi", "Someone Else")).toBeNull();
    expect(matchBook(docs, "Made Up Title", "Susanna Clarke")).toBeNull();
  });
});

describe("matchScreen", () => {
  const now = new Date("2026-10-04T12:00:00Z");

  it("matches the title within a year, the best known one first", () => {
    const results = [
      { id: 1, title: "Dune", release_date: "1984-12-14", vote_count: 3000 },
      { id: 2, title: "Dune", release_date: "2021-09-15", vote_count: 12000 },
      { id: 3, title: "Dune", release_date: "2021-01-01", vote_count: 5 },
    ];
    expect(matchScreen(results, "Dune", 2021, now)?.id).toBe(2);
    expect(matchScreen(results, "Dune", 1985, now)?.id).toBe(1);
  });

  it("reads shows and original titles, and skips what isn't out yet", () => {
    expect(
      matchScreen(
        [
          {
            id: 4,
            name: "Shōgun",
            original_name: "Shogun",
            first_air_date: "2024-02-27",
          },
        ],
        "Shogun",
        2024,
        now,
      )?.id,
    ).toBe(4);
    expect(
      matchScreen(
        [{ id: 5, title: "Soon", release_date: "2027-03-01" }],
        "Soon",
        2027,
        now,
      ),
    ).toBeNull();
    expect(matchScreen([], "Anything", 2020, now)).toBeNull();
  });
});
