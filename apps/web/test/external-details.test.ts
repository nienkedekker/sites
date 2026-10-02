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
