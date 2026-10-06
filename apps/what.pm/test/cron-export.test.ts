import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const reads = vi.hoisted(() => ({ count: 0 }));

vi.mock("@/utils/supabase/public", () => ({ supabasePublic: {} }));
vi.mock("@/utils/data/fetch-all", () => ({
  fetchAllRows: async () => {
    reads.count++;
    return [];
  },
}));

const { GET } = await import("@/app/api/cron/export/route");

const run = (auth?: string) =>
  GET(
    new NextRequest("https://www.what.pm/api/cron/export", {
      headers: auth ? { authorization: auth } : {},
    }),
  );

beforeEach(() => {
  reads.count = 0;
  vi.stubEnv("CRON_SECRET", "secret");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/cron/export", () => {
  it("turns away a request without the cron secret", async () => {
    vi.stubEnv("CLOUDFLARE_BUCKET_NAME", "backups");
    expect((await run()).status).toBe(401);
    expect((await run("Bearer nope")).status).toBe(401);
  });

  it("skips the backup without reading the log when there's no bucket", async () => {
    vi.stubEnv("CLOUDFLARE_BUCKET_NAME", "");
    const response = await run("Bearer secret");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ skipped: "no bucket" });
    expect(reads.count).toBe(0);
  });

  it("reads the log when there is a bucket", async () => {
    vi.stubEnv("CLOUDFLARE_BUCKET_NAME", "backups");
    const response = await run("Bearer secret");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ itemsExported: 0 });
    expect(reads.count).toBe(1);
  });
});
