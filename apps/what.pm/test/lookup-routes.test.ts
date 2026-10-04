import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const auth = vi.hoisted(() => ({
  user: { id: "me" } as { id: string } | null,
}));
const search = vi.hoisted(() => ({ searchItems: vi.fn() }));

vi.mock("next/cache", () => ({
  unstable_cache: <T>(lookup: T) => lookup,
}));
vi.mock("@/utils/supabase/server", () => ({
  createClientForServer: async () => ({
    auth: { getUser: async () => ({ data: { user: auth.user } }) },
  }),
}));
vi.mock("@/utils/server/item-search", () => search);

const titles = await import("@/app/api/titles/route");
const seasons = await import("@/app/api/seasons/route");
const items = await import("@/app/api/search/route");

const get = (path: string) => new NextRequest(`http://localhost${path}`);

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  auth.user = { id: "me" };
  fetchMock = vi.fn(async () => new Response("down", { status: 503 }));
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  search.searchItems.mockReset();
});

describe("GET /api/titles", () => {
  it("answers nothing when signed out, without asking the source", async () => {
    auth.user = null;
    const res = await titles.GET(get("/api/titles?type=Book&q=dune"));

    expect(await res.json()).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects unknown types and short queries", async () => {
    expect((await titles.GET(get("/api/titles?type=Game&q=dune"))).status).toBe(
      400,
    );
    expect((await titles.GET(get("/api/titles?type=Book&q=d"))).status).toBe(
      400,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("says when the source is down", async () => {
    const res = await titles.GET(get("/api/titles?type=Book&q=dune"));
    expect(res.status).toBe(502);
  });
});

describe("GET /api/seasons", () => {
  it("rejects ids that aren't TMDB ids", async () => {
    const res = await seasons.GET(get("/api/seasons?id=..%2Fsecrets"));

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers nothing when signed out", async () => {
    auth.user = null;
    const res = await seasons.GET(get("/api/seasons?id=85552"));

    expect(await res.json()).toEqual({});
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/search", () => {
  it("rejects queries under two characters", async () => {
    const res = await items.GET(get("/api/search?q=%20a%20"));

    expect(res.status).toBe(400);
    expect(search.searchItems).not.toHaveBeenCalled();
  });

  it("searches on the trimmed query, signed in or not", async () => {
    auth.user = null;
    search.searchItems.mockResolvedValue([{ id: "1", title: "Dune" }]);
    const res = await items.GET(get("/api/search?q=%20dune%20"));

    expect(await res.json()).toEqual({ results: [{ id: "1", title: "Dune" }] });
    expect(search.searchItems).toHaveBeenCalledWith("dune");
  });

  it("fails loudly when the database does", async () => {
    search.searchItems.mockRejectedValue(new Error("down"));
    const res = await items.GET(get("/api/search?q=dune"));

    expect(res.status).toBe(500);
  });
});
