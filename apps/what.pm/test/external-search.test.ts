import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  unstable_cache: <T>(lookup: T) => lookup,
}));

const { searchTitles, getSeasonYears } =
  await import("@/utils/server/title-search");

type Route = (url: URL, init?: RequestInit) => unknown;

function serve(routes: Record<string, Route>) {
  const fetchMock = vi.fn(async (input: URL | string, init?: RequestInit) => {
    const url = new URL(input);
    const route = routes[url.pathname];
    if (!route) return new Response("not found", { status: 404 });
    return Response.json(route(url, init));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const credits = (...directors: string[]) => ({
  crew: [
    { job: "Writer", name: "Someone Else" },
    ...directors.map((name) => ({ job: "Director", name })),
  ],
});

beforeEach(() => {
  vi.stubEnv("TMDB_API_KEY", "test-key");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("searchTitles", () => {
  it("waits for at least two characters", async () => {
    const fetchMock = serve({});

    expect(await searchTitles("Book", " d ")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fills books from OpenLibrary with the first author only", async () => {
    const fetchMock = serve({
      "/search.json": () => ({
        docs: [
          {
            key: "/works/OL1W",
            title: "The Library at Mount Char",
            author_name: ["Scott Hawkins", "Hillary Huber"],
            first_publish_year: 2015,
          },
          { key: "/works/OL2W", title: "No details" },
        ],
      }),
    });

    expect(await searchTitles("Book", "mount char")).toEqual([
      {
        id: "/works/OL1W",
        title: "The Library at Mount Char",
        year: 2015,
        creator: "Scott Hawkins",
      },
      { id: "/works/OL2W", title: "No details", year: null, creator: null },
    ]);
    const [, init] = fetchMock.mock.calls[0];
    expect(new Headers(init?.headers).get("User-Agent")).toContain("what.pm");
  });

  it("returns null when the source is down", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("down", { status: 503 })),
    );

    expect(await searchTitles("Book", "dune")).toBeNull();
  });

  it("skips movies and shows without a TMDB key", async () => {
    vi.stubEnv("TMDB_API_KEY", "");
    const fetchMock = serve({});

    expect(await searchTitles("Movie", "dune")).toEqual([]);
    expect(await searchTitles("Show", "euphoria")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fills movies with every director, comma separated", async () => {
    serve({
      "/3/search/movie": () => ({
        results: [
          {
            id: 1,
            title: "No Country for Old Men",
            release_date: "2007-05-19",
          },
        ],
      }),
      "/3/search/person": () => ({ results: [] }),
      "/3/movie/1/credits": () => credits("Joel Coen", "Ethan Coen"),
    });

    expect(await searchTitles("Movie", "no country")).toEqual([
      {
        id: "1",
        title: "No Country for Old Men",
        year: 2007,
        creator: "Joel Coen, Ethan Coen",
      },
    ]);
  });

  it("finds a director's released films by name, most popular first", async () => {
    serve({
      "/3/search/movie": () => ({
        results: [{ id: 99, title: "Villeneuve: A Documentary" }],
      }),
      "/3/search/person": () => ({
        results: [
          { id: 7, name: "Xavier Someone" },
          { id: 137427, name: "Denis Villeneuve" },
        ],
      }),
      "/3/person/137427/movie_credits": () => ({
        crew: [
          {
            id: 1,
            title: "Arrival",
            release_date: "2016-11-10",
            job: "Director",
            popularity: 20,
          },
          {
            id: 2,
            title: "Dune",
            release_date: "2021-09-15",
            job: "Director",
            popularity: 50,
          },
          {
            id: 2,
            title: "Dune",
            release_date: "2021-09-15",
            job: "Director",
            popularity: 50,
          },
          {
            id: 3,
            title: "Future Film",
            release_date: "2099-01-01",
            job: "Director",
            popularity: 90,
          },
          { id: 4, title: "Untitled", job: "Director", popularity: 80 },
          {
            id: 5,
            title: "Produced Only",
            release_date: "2015-01-01",
            job: "Producer",
            popularity: 70,
          },
        ],
      }),
      "/3/movie/1/credits": () => credits("Denis Villeneuve"),
      "/3/movie/2/credits": () => credits("Denis Villeneuve"),
    });

    const results = await searchTitles("Movie", "villeneuve");

    expect(results?.map((movie) => movie.title)).toEqual(["Dune", "Arrival"]);
    expect(results?.[0]).toMatchObject({
      year: 2021,
      creator: "Denis Villeneuve",
    });
  });

  it("prefers an exact title over a director with the same name", async () => {
    serve({
      "/3/search/movie": () => ({
        results: [{ id: 10, title: "Dune", release_date: "2021-09-15" }],
      }),
      "/3/search/person": () => ({ results: [{ id: 5, name: "Dune" }] }),
      "/3/person/5/movie_credits": () => ({
        crew: [
          {
            id: 11,
            title: "Other",
            release_date: "2000-01-01",
            job: "Director",
            popularity: 1,
          },
        ],
      }),
      "/3/movie/10/credits": () => credits("Denis Villeneuve"),
    });

    const results = await searchTitles("Movie", "dune");

    expect(results?.map((movie) => movie.title)).toEqual(["Dune"]);
  });

  it("fills shows with the first-air year", async () => {
    serve({
      "/3/search/tv": () => ({
        results: [
          { id: 85552, name: "Euphoria", first_air_date: "2019-06-16" },
        ],
      }),
    });

    expect(await searchTitles("Show", "euphoria")).toEqual([
      { id: "85552", title: "Euphoria", year: 2019, creator: null },
    ]);
  });
});

describe("getSeasonYears", () => {
  it("maps each season to the year it aired, without specials", async () => {
    serve({
      "/3/tv/85552": () => ({
        seasons: [
          { season_number: 0, air_date: "2020-12-06" },
          { season_number: 1, air_date: "2019-06-16" },
          { season_number: 2, air_date: "2022-01-09" },
          { season_number: 3, air_date: null },
        ],
      }),
    });

    expect(await getSeasonYears("85552")).toEqual({ 1: 2019, 2: 2022 });
  });

  it("ignores ids that aren't TMDB ids", async () => {
    const fetchMock = serve({});

    expect(await getSeasonYears("../secrets")).toEqual({});
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
