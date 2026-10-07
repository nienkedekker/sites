import { describe, expect, it } from "vitest";
import {
  dropReason,
  favouriteCreators,
  isByKnownCreator,
  isCollection,
  isLogged,
  keepNew,
  knownCreators,
  knownNames,
  logIndex,
  loggedPicks,
  pickSeeds,
  promptItems,
  seedWeights,
  volumeOf,
  type Found,
  type Suggestion,
} from "@/utils/data/recommend";
import { book, movie, show } from "./items";

const NOW = new Date("2026-10-04T12:00:00Z");
const recent = { created_at: "2026-09-01T12:00:00Z", belongs_to_year: 2026 };

function found(overrides: Partial<Found> = {}): Found {
  return {
    itemtype: "Book",
    external_id: "/works/OL1W",
    title: "Some Book",
    creator: "Some Author",
    year: 2020,
    ...overrides,
  };
}

function suggestion(overrides: Partial<Suggestion> = {}): Suggestion {
  return {
    itemtype: "Book",
    title: "Some Book",
    creator: "Some Author",
    year: 2020,
    reason: "Because.",
    because: [],
    ...overrides,
  };
}

describe("seedWeights", () => {
  it("weighs an author by how often they're logged", () => {
    const once = book({ ...recent, author: "Once" });
    const twice = [
      book({ ...recent, author: "Twice" }),
      book({ ...recent, author: "Twice" }),
    ];
    const weights = seedWeights([once, ...twice], NOW);
    expect(weights.get(twice[0].id)).toBeCloseTo(2 * weights.get(once.id)!);
  });

  it("matches co-authors and spellings of a name", () => {
    const solo = book({ ...recent, author: "A. D. Sui" });
    const pair = book({ ...recent, author: "A.D. Sui, Someone Else" });
    const weights = seedWeights([solo, pair], NOW);
    expect(weights.get(pair.id)).toBeCloseTo(weights.get(solo.id)!);
    expect(weights.get(solo.id)).toBeCloseTo(
      2 *
        seedWeights([book({ ...recent })], NOW)
          .values()
          .next().value!,
    );
  });

  it("doubles rereads", () => {
    const first = book({ ...recent, author: "A" });
    const again = book({ ...recent, author: "B", redo: true });
    const weights = seedWeights([first, again], NOW);
    expect(weights.get(again.id)).toBeCloseTo(2 * weights.get(first.id)!);
  });

  it("counts the seasons of a show", () => {
    const seasons = [1, 2, 3].map((season) =>
      show({ ...recent, external_id: "1399", season }),
    );
    const single = show({ ...recent, external_id: "42" });
    const weights = seedWeights([...seasons, single], NOW);
    expect(weights.get(seasons[0].id)).toBeCloseTo(3 * weights.get(single.id)!);
  });

  it("halves every two years, dating bulk imports by their year", () => {
    const now = book({ author: "A", created_at: NOW.toISOString() });
    const imported = book({
      author: "B",
      belongs_to_year: 2022,
      created_at: "2026-01-01T00:00:00Z",
    });
    const weights = seedWeights([now, imported], NOW);
    // July 2022 to October 2026 is about 4.25 years
    expect(weights.get(imported.id)! / weights.get(now.id)!).toBeCloseTo(
      0.5 ** (4.26 / 2),
      1,
    );
  });
});

describe("pickSeeds", () => {
  it("takes the heaviest works once each, plus every reread", () => {
    const seasons = [1, 2].map((season) =>
      show({ ...recent, external_id: "1399", season }),
    );
    const light = book({ external_id: "/works/OL2W", belongs_to_year: 2010 });
    const reread = book({
      external_id: "/works/OL3W",
      belongs_to_year: 2010,
      redo: true,
    });
    const heavy = book({ ...recent, external_id: "/works/OL4W" });
    const items = [...seasons, light, reread, heavy];
    const seeds = pickSeeds(items, seedWeights(items, NOW), 2);
    expect(seeds.map((seed) => seed.external_id).sort()).toEqual([
      "/works/OL3W",
      "/works/OL4W",
      "1399",
    ]);
  });
});

describe("promptItems", () => {
  it("keeps the last three years, rereads and seeds, newest first", () => {
    const now = new Date("2026-10-04T12:00:00Z");
    const recent = book({ title: "Recent", belongs_to_year: 2024 });
    const latest = movie({ title: "Latest", belongs_to_year: 2026 });
    const old = book({ title: "Old", belongs_to_year: 2023 });
    const reread = book({ title: "Reread", belongs_to_year: 2012, redo: true });
    const seed = show({ title: "Seed", belongs_to_year: 2015 });
    const titles = promptItems(
      [recent, latest, old, reread, seed],
      [seed],
      now,
    ).map((item) => item.title);
    expect(titles).toEqual(["Latest", "Recent", "Seed", "Reread"]);
  });
});

describe("favouriteCreators", () => {
  it("counts authors across the whole log, leaving hidden names out", () => {
    const items = [
      book({ author: "Ursula K. Le Guin" }),
      book({ author: "Ursula K. Le Guin, Someone" }),
      book({ author: "Someone" }),
      book({ author: "Hidden" }),
      book({ author: "Hidden" }),
      book({ author: "Hidden" }),
      movie({ director: "Not A Book" }),
    ];
    expect(favouriteCreators(items, "Book", new Set(["Hidden"]))).toEqual([
      "Someone (2)",
      "Ursula K. Le Guin (2)",
    ]);
  });
});

describe("isLogged", () => {
  it("matches on the external id", () => {
    const index = logIndex([
      movie({ external_id: "550", title: "Fight Club" }),
    ]);
    expect(
      isLogged(
        found({ itemtype: "Movie", external_id: "550", creator: null }),
        index,
      ),
    ).toBe(true);
    expect(
      isLogged(found({ itemtype: "Show", external_id: "550" }), index),
    ).toBe(false);
  });

  it("falls back to title and author across OpenLibrary and Google ids", () => {
    const index = logIndex([
      book({
        external_id: "4oePEQAAQBAJ",
        title: "Piranesi",
        author: "Susanna Clarke",
      }),
    ]);
    expect(
      isLogged(
        found({
          external_id: "/works/OL20W",
          title: "Piranesi: A Novel",
          creator: "Susanna  Clarke",
        }),
        index,
      ),
    ).toBe(true);
    expect(
      isLogged(found({ title: "Piranesi", creator: "Someone Else" }), index),
    ).toBe(false);
  });

  it("keeps remakes apart", () => {
    const index = logIndex([
      movie({
        external_id: "438631",
        title: "Dune",
        director: "Denis Villeneuve",
      }),
    ]);
    expect(
      isLogged(
        found({
          itemtype: "Movie",
          external_id: "841",
          title: "Dune",
          creator: "David Lynch",
        }),
        index,
      ),
    ).toBe(false);
  });

  it("counts dismissed picks", () => {
    const index = logIndex(
      [],
      [{ itemtype: "Book", external_id: "/works/OL9W" }],
    );
    expect(isLogged(found({ external_id: "/works/OL9W" }), index)).toBe(true);
  });

  it("tells volumes apart", () => {
    const index = logIndex([
      book({ title: "Chainsaw Man, Vol. 1", author: "Tatsuki Fujimoto" }),
    ]);
    expect(
      isLogged(
        found({
          title: "Chainsaw Man, Vol. 2",
          creator: "Tatsuki Fujimoto",
        }),
        index,
      ),
    ).toBe(false);
  });
});

describe("isCollection", () => {
  it("spots box sets and omnibuses", () => {
    for (const title of [
      "Locked Tomb Series",
      "The Locked Tomb Series (Books 1-3)",
      "Hunger Games Box Set",
      "The Expanse Boxed-Set",
      "Discworld Omnibus",
      "The Broken Earth Trilogy",
      "Mistborn: Books 1 to 3",
      "Into Shadow collection",
      "The Complete Novels of Jane Austen",
    ]) {
      expect(isCollection({ itemtype: "Book", title }), title).toBe(true);
    }
  });

  it("leaves single books alone, and anything on screen", () => {
    for (const title of [
      "A Series of Unfortunate Events",
      "The Collector",
      "Collected Stories",
      "Piranesi",
    ]) {
      expect(isCollection({ itemtype: "Book", title }), title).toBe(false);
    }
    expect(
      isCollection({ itemtype: "Show", title: "The Expanse Trilogy" }),
    ).toBe(false);
  });
});

describe("volumeOf", () => {
  it("reads the common ways volumes are written", () => {
    expect(volumeOf("Chainsaw Man, Vol. 2")).toEqual({
      series: "chainsaw man",
      volume: 2,
    });
    expect(volumeOf("Berserk Volume 12")).toEqual({
      series: "berserk",
      volume: 12,
    });
    expect(volumeOf("Saga #3")).toEqual({ series: "saga", volume: 3 });
    expect(volumeOf("Vol. 1")).toBeNull();
    expect(volumeOf("Volcano")).toBeNull();
  });
});

describe("knownCreators", () => {
  it("knows every author and director, and what's adapted from their books", () => {
    const known = knownCreators([
      book({ author: "Stephen King" }),
      movie({ director: "Denis Villeneuve" }),
    ]);
    expect(isByKnownCreator({ creator: "Stephen King" }, known)).toBe(true);
    expect(
      isByKnownCreator({ creator: "Denis  Villeneuve, Someone" }, known),
    ).toBe(true);
    expect(
      isByKnownCreator(
        { creator: "Andy Muschietti", based_on: "Stephen King" },
        known,
      ),
    ).toBe(true);
    expect(isByKnownCreator({ creator: "Someone New" }, known)).toBe(false);
  });

  it("lists each name once for the prompt", () => {
    expect(
      knownNames([
        book({ author: "Ursula K. Le Guin" }),
        book({ author: "Ursula K. Le Guin, Becky Chambers" }),
        movie({ director: "Céline Sciamma" }),
      ]),
    ).toEqual(["Becky Chambers", "Céline Sciamma", "Ursula K. Le Guin"]);
  });
});

describe("keepNew", () => {
  const items = [
    book({ external_id: "/works/OL9W", title: "Logged", author: "Old Friend" }),
  ];
  const index = logIndex(items, [{ itemtype: "Movie", external_id: "7" }]);
  const known = knownCreators(items);

  it("keeps what was found and is new, in Claude's order, up to the count", () => {
    const looked = [
      { suggestion: suggestion({ title: "Missing" }), found: null },
      {
        suggestion: suggestion({ title: "First" }),
        found: found({ external_id: "/works/OL1W", title: "First" }),
      },
      {
        suggestion: suggestion({ title: "Logged" }),
        found: found({ external_id: "/works/OL9W", title: "Logged" }),
      },
      {
        suggestion: suggestion({ itemtype: "Movie", title: "Dismissed" }),
        found: found({ itemtype: "Movie", external_id: "7" }),
      },
      {
        suggestion: suggestion({ title: "Known" }),
        found: found({ external_id: "/works/OL2W", creator: "Old Friend" }),
      },
      {
        suggestion: suggestion({ title: "Box" }),
        found: found({ external_id: "/works/OL3W", title: "Saga Box Set" }),
      },
      {
        suggestion: suggestion({ title: "First again" }),
        found: found({ external_id: "/works/OL1W", title: "First" }),
      },
      {
        suggestion: suggestion({ title: "Second" }),
        found: found({ external_id: "/works/OL4W", title: "Second" }),
      },
      {
        suggestion: suggestion({ title: "Third" }),
        found: found({ external_id: "/works/OL5W", title: "Third" }),
      },
    ];
    expect(
      keepNew(looked, index, known, 2).map((kept) => kept.suggestion.title),
    ).toEqual(["First", "Second"]);
  });

  it("says why a suggestion is left out", () => {
    const reason = (f: Parameters<typeof dropReason>[0]) =>
      dropReason(f, index, known, new Set(["Book|/works/OL1W"]));
    expect(reason(null)).toBe("not found");
    expect(reason(found({ external_id: "/works/OL1W" }))).toBe(
      "suggested twice",
    );
    expect(reason(found({ external_id: "/works/OL9W", title: "Logged" }))).toBe(
      "logged, dismissed or wanted",
    );
    expect(
      reason(found({ external_id: "/works/OL2W", creator: "Old Friend" })),
    ).toBe("known creator (Old Friend)");
    expect(
      reason(found({ external_id: "/works/OL3W", title: "Saga Box Set" })),
    ).toBe("collection");
    expect(reason(found({ external_id: "/works/OL4W", title: "New" }))).toBe(
      null,
    );
  });
});

describe("loggedPicks", () => {
  const saved = (overrides: Record<string, unknown> = {}) => ({
    itemtype: "Book",
    external_id: "/works/OL1W",
    title: "Picked",
    creator: "New Author",
    reason: "Because.",
    created_at: "2026-09-01T12:00:00Z",
    ...overrides,
  });

  it("pairs Claude's saved picks with their first log entry, newest first", () => {
    const first = book({
      external_id: "/works/OL1W",
      title: "Picked",
      created_at: "2026-09-11T09:00:00Z",
    });
    const reread = book({
      external_id: "/works/OL1W",
      title: "Picked",
      redo: true,
      created_at: "2026-10-01T09:00:00Z",
    });
    const later = movie({
      external_id: "8",
      title: "Watched",
      created_at: "2026-09-20T09:00:00Z",
    });
    const made = loggedPicks(
      [
        saved(),
        saved({ itemtype: "Movie", external_id: "8", title: "Watched" }),
        saved({ external_id: "/works/OL2W", title: "Not yet" }),
      ],
      [reread, later, first],
    );
    expect(made.map(({ item, days }) => [item.id, days])).toEqual([
      [later.id, 19],
      [first.id, 10],
    ]);
  });

  it("matches by title and author across ids", () => {
    const item = book({
      external_id: "abcGoogleId",
      title: "Picked: A Novel",
      author: "New Author",
      created_at: "2026-09-01T18:00:00Z",
    });
    expect(loggedPicks([saved()], [item])).toEqual([
      { pick: saved(), item, days: 0 },
    ]);
  });

  it("leaves out what I added myself", () => {
    const item = book({ external_id: "/works/OL1W", title: "Picked" });
    expect(loggedPicks([saved({ reason: null })], [item])).toEqual([]);
  });
});
