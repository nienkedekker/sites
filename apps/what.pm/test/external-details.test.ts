import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getExternalDetails,
  googleBooksPages,
} from "@/utils/server/external-api";

type Route = (url: URL) => unknown;

function serve(routes: Record<string, Route>) {
  const fetchMock = vi.fn(async (input: URL | string) => {
    const url = new URL(input);
    const route = routes[url.pathname];
    if (!route) return new Response("not found", { status: 404 });
    return Response.json(route(url));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.stubEnv("TMDB_API_KEY", "test-key");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("getExternalDetails", () => {
  it("takes the median page count across a book's editions, and its genres", async () => {
    serve({
      "/works/OL1W/editions.json": () => ({
        entries: [
          { number_of_pages: 900 },
          { number_of_pages: 412 },
          {},
          { number_of_pages: 0 },
          { number_of_pages: 1 },
          { number_of_pages: 1 },
          { number_of_pages: 1 },
          { number_of_pages: 380 },
        ],
      }),
      "/works/OL1W.json": () => ({
        subjects: ["Fiction, fantasy, epic", "New York Times bestseller"],
      }),
    });

    expect(await getExternalDetails("Book", "/works/OL1W")).toEqual({
      pages: 412,
      runtime_minutes: null,
      based_on: null,
      genres: ["Fantasy"],
    });
  });

  it("reads pages from a linked Google Books volume", async () => {
    vi.stubEnv("GOOGLE_API_KEY", "test-key");
    serve({
      "/books/v1/volumes/4oePEQAAQBAJ": () => ({
        volumeInfo: { printedPageCount: 352 },
      }),
    });

    expect(await getExternalDetails("Book", "4oePEQAAQBAJ")).toEqual({
      pages: 352,
      runtime_minutes: null,
      based_on: null,
      genres: [],
    });
  });

  it("gets a movie's runtime, genres and who wrote the book behind it", async () => {
    serve({
      "/3/movie/438631": (url) => {
        expect(url.searchParams.get("append_to_response")).toBe("credits");
        return {
          runtime: 155,
          genres: [{ name: "Science Fiction" }, { name: "Adventure" }],
          credits: {
            crew: [
              { job: "Director", name: "Denis Villeneuve" },
              { job: "Screenplay", name: "Jon Spaihts" },
              { job: "Novel", name: "Frank Herbert" },
            ],
          },
        };
      },
    });

    expect(await getExternalDetails("Movie", "438631")).toEqual({
      pages: null,
      runtime_minutes: 155,
      based_on: "Frank Herbert",
      genres: ["Science Fiction", "Adventure"],
    });
  });

  it("adds up a show season's episodes and lists each source author once", async () => {
    serve({
      "/3/tv/63639": (url) => {
        expect(url.searchParams.get("append_to_response")).toBe(
          "aggregate_credits",
        );
        return {
          seasons: [
            { season_number: 0 },
            { season_number: 1 },
            { season_number: 2 },
          ],
          genres: [{ name: "Drama" }, { name: "Sci-Fi & Fantasy" }],
          aggregate_credits: {
            crew: [
              { name: "Daniel Abraham", jobs: [{ job: "Novel" }] },
              {
                name: "Ty Franck",
                jobs: [{ job: "Novel" }, { job: "Writer" }],
              },
              { name: "Naren Shankar", jobs: [{ job: "Showrunner" }] },
            ],
          },
        };
      },
      "/3/tv/63639/season/2": () => ({
        episodes: [{ runtime: 44 }, { runtime: 45 }, { runtime: null }],
      }),
    });

    expect(await getExternalDetails("Show", "63639", 2)).toEqual({
      pages: null,
      runtime_minutes: 89,
      based_on: "Daniel Abraham, Ty Franck",
      genres: ["Drama", "Science Fiction", "Fantasy"],
    });
  });

  describe("anime TMDB files as one long season", () => {
    // My Dress-Up Darling: 12 episodes in 2022, 12 more in 2025, all "Season 1"
    const darling = () =>
      serve({
        "/3/tv/123249": () => ({
          seasons: [{ season_number: 0 }, { season_number: 1 }],
          aggregate_credits: { crew: [] },
        }),
        "/3/tv/123249/season/1": () => ({
          episodes: [
            ...Array.from({ length: 12 }, (_, i) => ({
              runtime: 24,
              air_date: `2022-01-${String(i * 2 + 1).padStart(2, "0")}`,
            })),
            ...Array.from({ length: 12 }, (_, i) => ({
              runtime: 24,
              air_date: `2025-07-${String(i * 2 + 1).padStart(2, "0")}`,
            })),
          ],
        }),
      });

    it("counts only the first part for season 1", async () => {
      darling();
      expect(
        (await getExternalDetails("Show", "123249", 1)).runtime_minutes,
      ).toBe(288);
    });

    it("finds a later season among the parts", async () => {
      darling();
      expect(
        (await getExternalDetails("Show", "123249", 2)).runtime_minutes,
      ).toBe(288);
    });

    it("leaves a season that hasn't aired yet empty, but keeps the credits", async () => {
      darling();
      expect(await getExternalDetails("Show", "123249", 3)).toEqual({
        pages: null,
        runtime_minutes: null,
        based_on: null,
        genres: [],
      });
    });
  });

  it("doesn't split a season of a show TMDB already numbers properly", async () => {
    serve({
      "/3/tv/1396": () => ({
        seasons: [{ season_number: 1 }, { season_number: 5 }],
        aggregate_credits: { crew: [] },
      }),
      // Breaking Bad's last season aired in two halves, a year apart
      "/3/tv/1396/season/5": () => ({
        episodes: [
          { runtime: 47, air_date: "2012-07-15" },
          { runtime: 47, air_date: "2013-08-11" },
        ],
      }),
    });

    expect((await getExternalDetails("Show", "1396", 5)).runtime_minutes).toBe(
      94,
    );
  });

  it("keeps the source author when the season can't be found", async () => {
    serve({
      "/3/tv/9": () => ({
        seasons: [{ season_number: 1 }, { season_number: 2 }],
        genres: [{ name: "Drama" }],
        aggregate_credits: {
          crew: [{ name: "Anne Rice", jobs: [{ job: "Novel" }] }],
        },
      }),
    });

    expect(await getExternalDetails("Show", "9", 3)).toEqual({
      pages: null,
      runtime_minutes: null,
      based_on: "Anne Rice",
      genres: ["Drama"],
    });
  });

  it("skips the season lookup when there's no season", async () => {
    const fetchMock = serve({
      "/3/tv/1": () => ({ aggregate_credits: { crew: [] } }),
    });

    expect(await getExternalDetails("Show", "1")).toEqual({
      pages: null,
      runtime_minutes: null,
      based_on: null,
      genres: [],
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("splits TV's combined genres and drops TV Movie", async () => {
    serve({
      "/3/movie/1": () => ({
        genres: [{ name: "TV Movie" }, { name: "Action" }],
        credits: { crew: [] },
      }),
      "/3/tv/2": () => ({
        genres: [{ name: "Action & Adventure" }, { name: "Action" }],
        aggregate_credits: { crew: [] },
      }),
    });

    expect((await getExternalDetails("Movie", "1")).genres).toEqual(["Action"]);
    expect((await getExternalDetails("Show", "2")).genres).toEqual([
      "Action",
      "Adventure",
    ]);
  });

  it("ignores ids that don't look like the source's", async () => {
    const fetchMock = serve({});

    for (const [type, id] of [
      ["Book", "../../admin"],
      ["Book", "OL1W"],
      ["Movie", "12; drop table"],
      ["Show", "/works/OL1W"],
    ] as const) {
      expect(await getExternalDetails(type, id)).toEqual({
        pages: null,
        runtime_minutes: null,
        based_on: null,
        genres: [],
      });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("skips movies and shows without a TMDB key", async () => {
    vi.stubEnv("TMDB_API_KEY", "");
    const fetchMock = serve({});

    await getExternalDetails("Movie", "1");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns empty details instead of failing when the source is down", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("down", { status: 503 })),
    );

    expect(await getExternalDetails("Movie", "1")).toEqual({
      pages: null,
      runtime_minutes: null,
      based_on: null,
      genres: [],
    });
  });
});

describe("googleBooksPages", () => {
  const volume = (title: string, authors: string[], pageCount?: number) => ({
    volumeInfo: { title, authors, pageCount },
  });

  beforeEach(() => vi.stubEnv("GOOGLE_API_KEY", "test-key"));

  it("takes the median page count of editions by the same author", async () => {
    serve({
      "/books/v1/volumes": (url) => {
        expect(url.searchParams.get("q")).toBe(
          "London Falling Patrick Radden Keefe",
        );
        return {
          items: [
            volume("London Falling", ["Patrick Radden Keefe"], 385),
            volume("London Falling", ["Patrick Radden Keefe"], 0),
            volume(
              "London Falling: A Mysterious Death",
              ["Patrick Radden Keefe"],
              400,
            ),
            volume("London Falling", ["Patrick Radden Keefe"], 420),
            volume("Patrick Radden Keefe: London Falling", ["Damon Cross"], 82),
            volume("London Falling", ["Paul Cornell"], 412),
          ],
        };
      },
    });

    expect(
      await googleBooksPages(
        "London Falling: A Mysterious Death in a Gilded City",
        "Patrick Radden Keefe",
      ),
    ).toBe(400);
  });

  it("matches authors written with other spacing or accents", async () => {
    serve({
      "/books/v1/volumes": () => ({
        items: [
          volume("The Iron Garden Sutra", ["A. D. Sui"], 401),
          volume("Long Island", ["Colm Toibin"], 304),
        ],
      }),
    });

    expect(await googleBooksPages("The Iron Garden Sutra", "A.D. Sui")).toBe(
      401,
    );
    expect(await googleBooksPages("Long Island", "Colm Tóibín")).toBe(304);
  });

  it("tries again once when Google Books is briefly down", async () => {
    vi.useFakeTimers();
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        ++calls === 1
          ? new Response("busy", { status: 503 })
          : Response.json({
              items: [volume("Slow Gods", ["Claire North"], 445)],
            }),
      ),
    );

    const pages = googleBooksPages("Slow Gods", "Claire North");
    await vi.advanceTimersByTimeAsync(1000);
    expect(await pages).toBe(445);
    vi.useRealTimers();
  });

  it("returns null without a key or when nothing matches", async () => {
    const fetchMock = serve({ "/books/v1/volumes": () => ({}) });

    expect(await googleBooksPages("Blacktail", "Scott Hawkins")).toBeNull();
    vi.stubEnv("GOOGLE_API_KEY", "");
    fetchMock.mockClear();
    expect(await googleBooksPages("Blacktail", "Scott Hawkins")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
