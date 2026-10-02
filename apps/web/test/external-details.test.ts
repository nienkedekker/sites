import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getExternalDetails } from "@/utils/server/external-api";

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
  it("takes the median page count across a book's editions", async () => {
    serve({
      "/works/OL1W/editions.json": () => ({
        entries: [
          { number_of_pages: 900 },
          { number_of_pages: 412 },
          {},
          { number_of_pages: 0 },
          { number_of_pages: 380 },
        ],
      }),
    });

    expect(await getExternalDetails("Book", "/works/OL1W")).toEqual({
      pages: 412,
      runtime_minutes: null,
      based_on: null,
    });
  });

  it("gets a movie's runtime and who wrote the book behind it", async () => {
    serve({
      "/3/movie/438631": (url) => {
        expect(url.searchParams.get("append_to_response")).toBe("credits");
        return {
          runtime: 155,
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
    });
  });

  it("adds up a show season's episodes and lists each source author once", async () => {
    serve({
      "/3/tv/63639": () => ({
        seasons: [
          { season_number: 0 },
          { season_number: 1 },
          { season_number: 2 },
        ],
      }),
      "/3/tv/63639/season/2": () => ({
        episodes: [{ runtime: 44 }, { runtime: 45 }, { runtime: null }],
      }),
      "/3/tv/63639/aggregate_credits": () => ({
        crew: [
          { name: "Daniel Abraham", jobs: [{ job: "Novel" }] },
          { name: "Ty Franck", jobs: [{ job: "Novel" }, { job: "Writer" }] },
          { name: "Naren Shankar", jobs: [{ job: "Showrunner" }] },
        ],
      }),
    });

    expect(await getExternalDetails("Show", "63639", 2)).toEqual({
      pages: null,
      runtime_minutes: 89,
      based_on: "Daniel Abraham, Ty Franck",
    });
  });

  describe("anime TMDB files as one long season", () => {
    // My Dress-Up Darling: 12 episodes in 2022, 12 more in 2025, all "Season 1"
    const darling = () =>
      serve({
        "/3/tv/123249": () => ({
          seasons: [{ season_number: 0 }, { season_number: 1 }],
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
        "/3/tv/123249/aggregate_credits": () => ({ crew: [] }),
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
      });
    });
  });

  it("doesn't split a season of a show TMDB already numbers properly", async () => {
    serve({
      "/3/tv/1396": () => ({
        seasons: [{ season_number: 1 }, { season_number: 5 }],
      }),
      // Breaking Bad's last season aired in two halves, a year apart
      "/3/tv/1396/season/5": () => ({
        episodes: [
          { runtime: 47, air_date: "2012-07-15" },
          { runtime: 47, air_date: "2013-08-11" },
        ],
      }),
      "/3/tv/1396/aggregate_credits": () => ({ crew: [] }),
    });

    expect((await getExternalDetails("Show", "1396", 5)).runtime_minutes).toBe(
      94,
    );
  });

  it("keeps the source author when the season can't be found", async () => {
    serve({
      "/3/tv/9/aggregate_credits": () => ({
        crew: [{ name: "Anne Rice", jobs: [{ job: "Novel" }] }],
      }),
    });

    expect(await getExternalDetails("Show", "9", 3)).toEqual({
      pages: null,
      runtime_minutes: null,
      based_on: "Anne Rice",
    });
  });

  it("skips the season lookup when there's no season", async () => {
    const fetchMock = serve({
      "/3/tv/1/aggregate_credits": () => ({ crew: [] }),
    });

    expect(await getExternalDetails("Show", "1")).toEqual({
      pages: null,
      runtime_minutes: null,
      based_on: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
    });
  });
});
