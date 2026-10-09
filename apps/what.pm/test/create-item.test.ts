import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  inserted: [] as Record<string, unknown>[],
  deleted: [] as Record<string, unknown>[],
  wanted: null as Record<string, unknown> | null,
  error: null as { message: string } | null,
  user: { id: "nienke" } as { id: string } | null,
}));

const getExternalDetails = vi.hoisted(() => vi.fn());
const googleBooksPages = vi.hoisted(() => vi.fn());
const updateTag = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ updateTag, revalidatePath: vi.fn() }));

vi.mock("@/utils/supabase/server", () => ({
  createClientForServer: async () => ({
    auth: { getUser: async () => ({ data: { user: db.user } }) },
    from: () => ({
      insert: (row: Record<string, unknown>) => {
        db.inserted.push(row);
        return {
          error: db.error,
          select: () => ({
            single: async () =>
              db.error
                ? { data: null, error: db.error }
                : { data: { id: 42 }, error: null },
          }),
        };
      },
      select: () => ({
        match: () => ({
          maybeSingle: async () => ({ data: db.wanted, error: null }),
        }),
      }),
      delete: () => ({
        match: async (key: Record<string, unknown>) => {
          db.deleted.push(key);
          return { error: null };
        },
      }),
    }),
  }),
}));

vi.mock("@/utils/server/external-api", () => ({
  getExternalDetails,
  googleBooksPages,
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw { digest: `NEXT_REDIRECT;${url}` };
  },
  unstable_rethrow: (error: unknown) => {
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_")) {
      throw error;
    }
  },
}));

const { createItemAction, startUpNextAction } =
  await import("@/app/actions/items");

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

const slowGods = {
  itemtype: "Book",
  title: "Slow Gods",
  author: "Claire North",
  publishedYear: "2025",
  belongsToYear: String(year),
  redo: "",
};

beforeEach(() => {
  db.inserted = [];
  db.deleted = [];
  db.wanted = null;
  db.error = null;
  db.user = { id: "nienke" };
  getExternalDetails.mockReset();
  googleBooksPages.mockReset();
  updateTag.mockReset();
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
    ).rejects.toMatchObject({ digest: `NEXT_REDIRECT;/year/${year}#item-42` });

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

  it("saves a finished show as not in progress", async () => {
    const severance = {
      itemtype: "Show",
      title: "Severance",
      season: "2",
      publishedYear: "2025",
      belongsToYear: String(year),
      redo: "",
    };

    await createItemAction(form(severance)).catch(() => {});
    await createItemAction(form({ ...severance, inProgress: "on" })).catch(
      () => {},
    );
    await createItemAction(form(dune)).catch(() => {});

    expect(db.inserted.map((row) => row.in_progress)).toEqual([
      false,
      true,
      null,
    ]);
  });

  it("saves a book I'm still reading as in progress", async () => {
    await createItemAction(form(slowGods)).catch(() => {});
    await createItemAction(form({ ...slowGods, inProgress: "on" })).catch(
      () => {},
    );

    expect(db.inserted.map((row) => row.in_progress)).toEqual([false, true]);
  });

  it("saves typed-in items without looking anything up", async () => {
    await createItemAction(form(dune)).catch(() => {});

    expect(getExternalDetails).not.toHaveBeenCalled();
    expect(db.inserted[0]).toMatchObject({ title: "Dune", external_id: null });
    expect(db.inserted[0]).not.toHaveProperty("runtime_minutes");
  });

  it("asks Google Books for pages when OpenLibrary has none", async () => {
    getExternalDetails.mockResolvedValue({
      pages: null,
      runtime_minutes: null,
      based_on: null,
    });
    googleBooksPages.mockResolvedValue(445);

    await createItemAction(
      form({ ...slowGods, externalId: "/works/OL45246981W" }),
    ).catch(() => {});

    expect(googleBooksPages).toHaveBeenCalledWith("Slow Gods", "Claire North");
    expect(db.inserted[0]).toMatchObject({ pages: 445 });
  });

  it("keeps pages I typed in over any lookup", async () => {
    await createItemAction(form({ ...slowGods, pages: "450" })).catch(() => {});

    expect(googleBooksPages).not.toHaveBeenCalled();
    expect(db.inserted[0]).toMatchObject({ pages: 450 });
  });

  it("files a backlogged item under the year I picked", async () => {
    await expect(
      createItemAction(form({ ...dune, belongsToYear: "2024" })),
    ).rejects.toMatchObject({ digest: "NEXT_REDIRECT;/year/2024#item-42" });

    expect(db.inserted[0]).toMatchObject({ belongs_to_year: 2024 });
  });

  it("refreshes the cached stats once the item is saved", async () => {
    await createItemAction(form(dune)).catch(() => {});

    expect(updateTag).toHaveBeenCalledWith("items");
  });

  it("leaves the cache alone when saving fails", async () => {
    db.error = { message: "nope" };

    expect(await createItemAction(form(dune))).toEqual({
      error: "Unable to save your item. Please try again.",
    });
    expect(updateTag).not.toHaveBeenCalled();
  });

  it("returns validation errors instead of saving", async () => {
    const result = await createItemAction(form({ ...dune, title: "" }));

    expect(result.error).toBeTruthy();
    expect(db.inserted).toHaveLength(0);
  });

  it("skips the lookups and the insert when I'm signed out", async () => {
    db.user = null;

    expect(
      await createItemAction(form({ ...dune, externalId: "438631" })),
    ).toEqual({ error: expect.stringContaining("Sign in") });
    expect(getExternalDetails).not.toHaveBeenCalled();
    expect(db.inserted).toHaveLength(0);
  });
});

describe("startUpNextAction", () => {
  const started = (fields: Record<string, string>) =>
    startUpNextAction(form(fields));

  it("logs the book to this year as in progress and takes it off up next", async () => {
    db.wanted = {
      title: "Slow Gods",
      creator: "Claire North",
      published_year: 2025,
    };
    getExternalDetails.mockResolvedValue({ pages: 600 });

    expect(await started({ itemtype: "Book", externalId: "OL1W" })).toEqual({
      error: null,
    });
    expect(getExternalDetails).toHaveBeenCalledWith("Book", "OL1W", null);
    expect(db.inserted[0]).toMatchObject({
      title: "Slow Gods",
      author: "Claire North",
      itemtype: "Book",
      published_year: 2025,
      belongs_to_year: year,
      external_id: "OL1W",
      pages: 600,
      redo: false,
      in_progress: true,
    });
    expect(db.deleted).toEqual([{ itemtype: "Book", external_id: "OL1W" }]);
  });

  it("starts a show at season 1, without a book's page lookup", async () => {
    db.wanted = {
      title: "Severance",
      creator: "Dan Erickson",
      published_year: 2022,
    };
    getExternalDetails.mockResolvedValue({ runtime_minutes: 500 });

    expect(await started({ itemtype: "Show", externalId: "95396" })).toEqual({
      error: null,
    });
    expect(getExternalDetails).toHaveBeenCalledWith("Show", "95396", 1);
    expect(googleBooksPages).not.toHaveBeenCalled();
    expect(db.inserted[0]).toMatchObject({
      title: "Severance",
      itemtype: "Show",
      season: 1,
      author: null,
      pages: null,
      in_progress: true,
    });
    expect(db.deleted).toEqual([{ itemtype: "Show", external_id: "95396" }]);
  });

  it("doesn't start movies", async () => {
    expect(await started({ itemtype: "Movie", externalId: "438631" })).toEqual({
      error: "Invalid request.",
    });
    expect(db.inserted).toHaveLength(0);
  });

  it("asks for the log form when up next has no author or year", async () => {
    db.wanted = { title: "Slow Gods", creator: null, published_year: 2025 };

    expect(
      (await started({ itemtype: "Book", externalId: "OL1W" })).error,
    ).toMatch(/log form/);
    expect(db.inserted).toHaveLength(0);
    expect(db.deleted).toHaveLength(0);
  });

  it("keeps it on up next when the insert fails", async () => {
    db.wanted = {
      title: "Slow Gods",
      creator: "Claire North",
      published_year: 2025,
    };
    db.error = { message: "nope" };

    expect(
      (await started({ itemtype: "Book", externalId: "OL1W" })).error,
    ).toBeTruthy();
    expect(db.deleted).toHaveLength(0);
  });

  it("does nothing when I'm signed out", async () => {
    db.user = null;

    expect(
      (await started({ itemtype: "Book", externalId: "OL1W" })).error,
    ).toMatch(/Sign in/);
    expect(db.inserted).toHaveLength(0);
  });
});
