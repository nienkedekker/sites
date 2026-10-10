import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UpNextItem } from "@/utils/data/up-next";

const upNext = vi.hoisted(() => ({ getUpNext: vi.fn() }));

vi.mock("next/cache", () => ({
  cacheLife: () => {},
  cacheTag: () => {},
}));
vi.mock("@/utils/data/up-next", () => upNext);
vi.mock("next/server", async (original) => ({
  ...(await original<typeof import("next/server")>()),
  connection: async () => {},
}));

const movies = await import("@/app/api/v1/up-next/movies/route");
const shows = await import("@/app/api/v1/up-next/shows/route");
const books = await import("@/app/api/v1/up-next/books/route");

const item = (overrides: Partial<UpNextItem>): UpNextItem => ({
  itemtype: "Movie",
  external_id: "1",
  title: "A title",
  creator: null,
  published_year: 2020,
  created_at: "2026-10-01T12:00:00Z",
  ...overrides,
});

const LIST = [
  item({ itemtype: "Movie", external_id: "438631", title: "Dune" }),
  item({
    itemtype: "Book",
    external_id: "/works/OL893415W",
    title: "Dune",
    creator: "Frank Herbert",
    published_year: 1965,
  }),
  item({ itemtype: "Show", external_id: "95396", title: "Severance" }),
  item({ itemtype: "Show", external_id: "1399", title: "Game of Thrones" }),
  item({ itemtype: "Show", external_id: "42", title: "Not on TVDB" }),
];

// TMDB's external ids, keyed by TMDB show id
const TVDB: Record<string, number | null> = { "95396": 371980, "42": null };

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  upNext.getUpNext.mockResolvedValue(LIST);
  fetchMock = vi.fn(async (url: URL) => {
    const id = url.pathname.match(/\/tv\/(\d+)\/external_ids/)?.[1] ?? "";
    if (!(id in TVDB)) return new Response("down", { status: 503 });
    return Response.json({ tvdb_id: TVDB[id] });
  });
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  upNext.getUpNext.mockReset();
});

describe("GET /api/v1/up-next/movies", () => {
  it("lists movies by TMDB id, the way Radarr reads them", async () => {
    const res = await movies.GET();

    expect(await res.json()).toEqual([{ id: 438631, title: "Dune" }]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails loudly when up next can't be read", async () => {
    upNext.getUpNext.mockRejectedValue(new Error("down"));
    expect((await movies.GET()).status).toBe(500);
  });
});

describe("GET /api/v1/up-next/shows", () => {
  it("lists shows by TVDB id, leaving out ones TVDB doesn't know or that fail", async () => {
    const res = await shows.GET();

    expect(await res.json()).toEqual([{ tvdbId: 371980, title: "Severance" }]);
  });

  it("fails loudly when up next can't be read", async () => {
    upNext.getUpNext.mockRejectedValue(new Error("down"));
    expect((await shows.GET()).status).toBe(500);
  });
});

describe("GET /api/v1/up-next/books", () => {
  it("lists books with the title and author a search needs", async () => {
    const res = await books.GET();

    expect(await res.json()).toEqual([
      {
        id: "/works/OL893415W",
        title: "Dune",
        author: "Frank Herbert",
        year: 1965,
      },
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails loudly when up next can't be read", async () => {
    upNext.getUpNext.mockRejectedValue(new Error("down"));
    expect((await books.GET()).status).toBe(500);
  });
});
