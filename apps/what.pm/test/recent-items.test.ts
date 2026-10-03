import { beforeEach, describe, expect, it, vi } from "vitest";
import { book } from "./items";

const db = vi.hoisted(() => ({
  result: {
    data: [] as unknown[] | null,
    error: null as { message: string } | null,
  },
}));

vi.mock("@/utils/supabase/public", () => {
  const query = {
    select: () => query,
    order: () => query,
    limit: async () => db.result,
  };
  return { supabasePublic: { from: () => query } };
});

const cache = vi.hoisted(() => ({ tags: [] as string[] }));
vi.mock("next/cache", () => ({
  unstable_cache: <T>(fn: T, _keys: string[], opts: { tags: string[] }) => {
    cache.tags = opts.tags;
    return fn;
  },
}));

const { getRecentItems } = await import("@/utils/data/items");

beforeEach(() => {
  db.result = { data: [], error: null };
});

describe("getRecentItems", () => {
  it("is cached under the items tag", () => {
    expect(cache.tags).toEqual(["items"]);
  });

  it("returns valid items", async () => {
    db.result = {
      data: [book({ title: "Wolf Hall" }), { junk: true }],
      error: null,
    };

    const result = await getRecentItems(5);

    expect(result.success).toBe(true);
    expect(result.data?.map((item) => item.title)).toEqual(["Wolf Hall"]);
  });

  it("reports a database error as a failure", async () => {
    db.result = { data: null, error: { message: "down" } };

    expect(await getRecentItems(5)).toEqual({
      success: false,
      data: null,
      error: "Failed to fetch items: down",
    });
  });
});
