import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  inserted: [] as Record<string, unknown>[],
  error: null as { message: string } | null,
}));

const getExternalDetails = vi.hoisted(() => vi.fn());
const revalidateTag = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidateTag }));

vi.mock("@/utils/supabase/server", () => ({
  createClientForServer: async () => ({
    from: () => ({
      insert: async (row: Record<string, unknown>) => {
        db.inserted.push(row);
        return { error: db.error };
      },
    }),
  }),
}));

vi.mock("@/utils/server/external-api", () => ({ getExternalDetails }));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw { digest: `NEXT_REDIRECT;${url}` };
  },
}));

const { createItemAction } = await import("@/app/actions/items");

const year = new Date().getFullYear();

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.append(name, value);
  return data;
}

const dune = {
  itemtype: "Movie",
  title: "Dune",
  director: "Denis Villeneuve",
  publishedYear: "2021",
  belongsToYear: String(year),
  redo: "",
};

beforeEach(() => {
  db.inserted = [];
  db.error = null;
  getExternalDetails.mockReset();
  revalidateTag.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("createItemAction", () => {
  it("stores the picked match with its pages, runtime and source", async () => {
    getExternalDetails.mockResolvedValue({
      pages: null,
      runtime_minutes: 155,
      based_on: "Frank Herbert",
    });

    await expect(
      createItemAction(form({ ...dune, externalId: "438631" })),
    ).rejects.toMatchObject({ digest: `NEXT_REDIRECT;/year/${year}` });

    expect(getExternalDetails).toHaveBeenCalledWith("Movie", "438631", null);
    expect(db.inserted[0]).toMatchObject({
      title: "Dune",
      external_id: "438631",
      runtime_minutes: 155,
      based_on: "Frank Herbert",
      pages: null,
    });
  });

  it("looks up a show's runtime for the season I logged", async () => {
    getExternalDetails.mockResolvedValue({
      pages: null,
      runtime_minutes: 400,
      based_on: null,
    });

    await createItemAction(
      form({
        itemtype: "Show",
        title: "Severance",
        season: "2",
        publishedYear: "2025",
        belongsToYear: String(year),
        redo: "",
        externalId: "95396",
      }),
    ).catch(() => {});

    expect(getExternalDetails).toHaveBeenCalledWith("Show", "95396", 2);
  });

  it("saves typed-in items without looking anything up", async () => {
    await createItemAction(form(dune)).catch(() => {});

    expect(getExternalDetails).not.toHaveBeenCalled();
    expect(db.inserted[0]).toMatchObject({ title: "Dune", external_id: null });
    expect(db.inserted[0]).not.toHaveProperty("runtime_minutes");
  });

  it("refreshes the cached stats once the item is saved", async () => {
    await createItemAction(form(dune)).catch(() => {});

    expect(revalidateTag).toHaveBeenCalledWith("items");
  });

  it("leaves the cache alone when saving fails", async () => {
    db.error = { message: "nope" };

    await expect(createItemAction(form(dune))).rejects.toMatchObject({
      digest: expect.stringContaining("/create?error="),
    });
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
