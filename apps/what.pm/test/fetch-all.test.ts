import { describe, expect, it } from "vitest";
import { fetchAllRows } from "@/utils/data/fetch-all";

function table(size: number) {
  const rows = Array.from({ length: size }, (_, i) => i);
  const calls: [number, number][] = [];
  const page = async (from: number, to: number) => {
    calls.push([from, to]);
    return { data: rows.slice(from, to + 1), error: null };
  };
  return { page, calls };
}

describe("fetchAllRows", () => {
  it("pages past Supabase's 1000-row cap", async () => {
    const { page, calls } = table(2500);

    expect(await fetchAllRows(page)).toHaveLength(2500);
    expect(calls).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ]);
  });

  it("asks once more when the last page is exactly full", async () => {
    const { page, calls } = table(1000);

    expect(await fetchAllRows(page)).toHaveLength(1000);
    expect(calls).toHaveLength(2);
  });

  it("throws on a database error", async () => {
    await expect(
      fetchAllRows(async () => ({ data: null, error: { message: "nope" } })),
    ).rejects.toThrow("nope");
  });
});
