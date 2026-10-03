import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TypedItem } from "@/types/shared";
import { book, movie, show } from "./items";

const recent = vi.hoisted(() => ({
  result: { success: true, data: [], error: null } as
    | { success: true; data: TypedItem[]; error: null }
    | { success: false; data: null; error: string },
}));

vi.mock("@/utils/data/items", () => ({
  getRecentItems: async () => recent.result,
}));

const { GET } = await import("@/app/feed.xml/route");

const feed = async (items: TypedItem[]) => {
  recent.result = { success: true, data: items, error: null };
  const response = await GET();
  return { response, xml: await response.text() };
};

const titles = (xml: string) =>
  [...xml.matchAll(/<item>\s*<title>(.*?)<\/title>/g)].map((m) => m[1]);

beforeEach(() => {
  recent.result = { success: true, data: [], error: null };
});

describe("GET /feed.xml", () => {
  it("serves RSS with a self link", async () => {
    const { response, xml } = await feed([]);

    expect(response.headers.get("Content-Type")).toContain(
      "application/rss+xml",
    );
    expect(xml).toContain(
      '<atom:link href="https://what.pm/feed.xml" rel="self"',
    );    expect(xml).toContain("<title>what. · what.pm</title>");
  });

  it("words each entry by type", async () => {
    const { xml } = await feed([
      book({ title: "Gideon the Ninth", author: "Tamsyn Muir" }),
      book({ title: "Wolf Hall", author: "Hilary Mantel", redo: true }),
      movie({ title: "Dune", published_year: 2021 }),
      movie({ title: "Heat", published_year: 1995, redo: true }),
      show({ title: "Severance", season: 2, in_progress: true }),
      show({ title: "The Leftovers", season: 1 }),
    ]);

    expect(titles(xml)).toEqual([
      "Read Gideon the Ninth by Tamsyn Muir",
      "Reread Wolf Hall by Hilary Mantel",
      "Watched Dune (2021)",
      "Rewatched Heat (1995)",
      "Watching Severance, season 2",
      "Watched The Leftovers, season 1",
    ]);
  });

  it("links each entry to its year and escapes XML", async () => {
    const { xml } = await feed([
      book({
        title: "Salt & <Sugar>",
        author: "O’Brien & Sons",
        belongs_to_year: 2019,
      }),
    ]);

    expect(xml).toContain(
      "<title>Read Salt &amp; &lt;Sugar&gt; by O’Brien &amp; Sons</title>",
    );
    expect(xml).toContain("<link>https://what.pm/year/2019</link>");
    expect(xml).not.toContain("<Sugar>");
  });

  it("dates entries by when they were logged", async () => {
    const { xml } = await feed([
      book({ created_at: "2026-09-22T15:41:53Z" }),
      book({ created_at: null }),
    ]);

    expect(xml).toContain("<pubDate>Tue, 22 Sep 2026 15:41:53 GMT</pubDate>");
    expect(xml.match(/<pubDate>/g)).toHaveLength(1);
  });

  it("returns 503 when items can't be loaded", async () => {
    recent.result = { success: false, data: null, error: "down" };

    expect((await GET()).status).toBe(503);
  });
});
