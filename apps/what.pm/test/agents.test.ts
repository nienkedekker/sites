import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import type { TypedItem } from "@/types/shared";
import { markdownTarget, prefersMarkdown } from "@/utils/agents/negotiate";
import {
  aboutMarkdown,
  notFoundMarkdown,
  yearMarkdown,
} from "@/utils/agents/markdown";
import {
  JSON_LD,
  LLMS_TXT,
  OPENAPI,
  jsonLdScript,
} from "@/utils/agents/discovery";
import { book, movie, show } from "./items";

const state = vi.hoisted(() => ({
  items: [] as unknown[],
  success: true,
}));

vi.mock("@/utils/data/items", () => ({
  getItemsForYear: async () =>
    state.success
      ? { success: true, data: state.items, error: null }
      : { success: false, data: null, error: "down" },
}));

vi.mock("@/utils/data/about", () => ({
  getLogFacts: async () => ({
    total: 3,
    books: 1,
    movies: 1,
    shows: 1,
    firstYear: 2019,
    yearCount: 2,
    firstEntry: null,
  }),
}));

vi.mock("@/utils/supabase/middleware", () => ({
  updateSession: async (request: NextRequest) => NextResponse.next({ request }),
}));

const { GET: markdownGET } = await import("@/app/markdown/[[...path]]/route");
const { GET: llmsGET } = await import("@/app/llms.txt/route");
const { GET: openapiGET } = await import("@/app/openapi.json/route");
const { proxy } = await import("@/proxy");

beforeEach(() => {
  state.items = [];
  state.success = true;
});

describe("prefersMarkdown", () => {
  it("picks Markdown when asked for by name", () => {
    expect(prefersMarkdown("text/markdown")).toBe(true);
    expect(prefersMarkdown("text/markdown, text/html;q=0.9")).toBe(true);
    expect(prefersMarkdown("text/markdown, */*")).toBe(true);
    expect(prefersMarkdown("Text/Markdown; charset=utf-8")).toBe(true);
  });

  it("keeps browsers and wildcards on HTML", () => {
    expect(prefersMarkdown(null)).toBe(false);
    expect(prefersMarkdown("*/*")).toBe(false);
    expect(prefersMarkdown("text/html")).toBe(false);
    expect(
      prefersMarkdown(
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      ),
    ).toBe(false);
    expect(prefersMarkdown("text/html, text/markdown;q=0.5")).toBe(false);
    expect(prefersMarkdown("text/markdown;q=0")).toBe(false);
  });
});

describe("markdownTarget", () => {
  it("knows the pages with a Markdown version", () => {
    expect(markdownTarget("/")).toEqual({ kind: "year", year: null });
    expect(markdownTarget("/year/2024")).toEqual({ kind: "year", year: 2024 });
    expect(markdownTarget("/year/2024/")).toEqual({ kind: "year", year: 2024 });
    expect(markdownTarget("/about")).toEqual({ kind: "about" });
  });

  it("leaves other pages, files and APIs alone", () => {
    for (const path of [
      "/stats",
      "/search",
      "/create",
      "/sign-in",
      "/settings/download",
      "/api/v1/summary",
      "/feed.xml",
      "/llms.txt",
      "/year/2024/opengraph-image",
      "/opengraph-image",
      "/stats/opengraph-image",
      "/up-next/opengraph-image",
      "/og/genres/fantasy/cozy-fantasy",
      "/_next/data/x.json",
    ]) {
      expect(markdownTarget(path).kind, path).toBe("skip");
    }
  });

  it("calls anything else missing", () => {
    expect(markdownTarget("/__ora-404-probe").kind).toBe("missing");
    expect(markdownTarget("/year/nope").kind).toBe("missing");
    expect(markdownTarget("/about/more").kind).toBe("missing");
  });

  it("never calls a real page missing", () => {
    const app = fileURLToPath(new URL("../app", import.meta.url));
    const routes = readdirSync(app, { recursive: true, encoding: "utf8" })
      .filter((file) =>
        /(^|\/)(page\.tsx|route\.tsx?|opengraph-image\.tsx)$/.test(file),
      )
      .map((file) =>
        `/${relative(app, join(app, file))}`
          .replace(/\/(page\.tsx|route\.tsx?)$/, "")
          .replace(/\.tsx$/, "")
          .replace(/\/\([^)]+\)/g, "")
          .replace("[year]", "2024")
          .replace("/[[...path]]", ""),
      );

    expect(routes.length).toBeGreaterThan(5);
    for (const route of routes) {
      expect(markdownTarget(route || "/").kind, route).not.toBe("missing");
    }
  });
});

describe("yearMarkdown", () => {
  it("lists each type under its own heading", () => {
    const md = yearMarkdown(
      2026,
      [
        book({ title: "Dune", author: "Frank Herbert", published_year: 1965 }),
        movie({ title: "Heat", director: "Michael Mann", redo: true }),
        show({ title: "Severance", season: 2, in_progress: true }),
      ] as TypedItem[],
      true,
    );

    expect(md).toMatch(/^# 2026 · what\.pm\n/);
    expect(md).toContain("so far this year");
    expect(md).toContain("## Books (1)\n\n- **Dune** by Frank Herbert (1965)");
    expect(md).toContain(
      "**Heat**, directed by Michael Mann (2020), rewatched",
    );
    expect(md).toContain("**Severance**, season 2, still watching");
    expect(md).toContain("https://www.what.pm/llms.txt");
  });

  it("lists what I didn't finish but leaves it out of the total", () => {
    const md = yearMarkdown(
      2025,
      [
        book({ title: "Dune", author: "Frank Herbert", published_year: 1965 }),
        book({
          title: "Ulysses",
          author: "James Joyce",
          published_year: 1922,
          did_not_finish: true,
        }),
      ] as TypedItem[],
      false,
    );

    expect(md).toContain("1 thing in total. 1 more was left unfinished.");
    expect(md).toContain("**Ulysses** by James Joyce (1922), didn't finish");
  });

  it("escapes Markdown in titles", () => {
    expect(
      yearMarkdown(2020, [book({ title: "*Not* bold" })], false),
    ).toContain("**\\*Not\\* bold**");
  });
});

describe("GET /markdown", () => {
  const get = (path?: string[]) =>
    markdownGET(new Request("https://www.what.pm/markdown"), {
      params: Promise.resolve({ path }),
    });

  it("serves this year for the homepage", async () => {
    state.items = [book({ title: "Dune" })];
    const response = await get();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(response.headers.get("vary")).toBe("Accept");
    const body = await response.text();
    expect(body).toContain(`# ${new Date().getFullYear()} · what.pm`);
    expect(body).toContain("**Dune**");
  });

  it("serves a past year and the about page", async () => {
    expect(await (await get(["year", "2019"])).text()).toContain("# 2019");
    expect(await (await get(["about"])).text()).toContain(
      "3 things logged across 2 years",
    );
  });

  it("answers unknown paths with a Markdown 404", async () => {
    const response = await get(["nope"]);
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("text/markdown");
    const body = await response.text();
    expect(body).toBe(notFoundMarkdown("/nope"));
    expect(body).toContain("https://www.what.pm/llms.txt");
  });

  it("reports when the log can't be loaded", async () => {
    state.success = false;
    expect((await get()).status).toBe(503);
  });
});

describe("proxy", () => {
  const request = (path: string, accept: string) =>
    new NextRequest(`https://www.what.pm${path}`, { headers: { accept } });
  const rewrite = (response: Response) =>
    response.headers.get("x-middleware-rewrite");

  it("rewrites Markdown requests to the Markdown route", async () => {
    expect(rewrite(await proxy(request("/", "text/markdown")))).toBe(
      "https://www.what.pm/markdown",
    );
    expect(rewrite(await proxy(request("/year/2020", "text/markdown")))).toBe(
      "https://www.what.pm/markdown/year/2020",
    );
    expect(rewrite(await proxy(request("/nope", "text/markdown")))).toBe(
      "https://www.what.pm/markdown/nope",
    );
  });

  it("keeps serving HTML to everyone else", async () => {
    expect(rewrite(await proxy(request("/", "text/html")))).toBeNull();
    expect(rewrite(await proxy(request("/", "*/*")))).toBeNull();
  });

  it("leaves pages without a Markdown version alone", async () => {
    expect(rewrite(await proxy(request("/stats", "text/markdown")))).toBeNull();
  });
});

describe("discovery files", () => {
  it("serves llms.txt in the llmstxt.org shape", async () => {
    const response = llmsGET();
    expect(response.headers.get("content-type")).toContain("text/markdown");
    const body = await response.text();
    expect(body).toBe(LLMS_TXT);
    expect(body).toMatch(/^# what\.pm\n\n> .+\n/);
    expect(body).toContain("## what.pm API");
    expect(body).toContain("(https://www.what.pm/openapi.json)");
    expect(body).toContain("## Optional");
  });

  it("serves an OpenAPI 3.1 spec for the summary and up next APIs", async () => {
    const spec = await openapiGET().json();
    expect(spec).toEqual(JSON.parse(JSON.stringify(OPENAPI)));
    expect(spec.openapi).toBe("3.1.0");
    expect(Object.keys(spec.paths)).toEqual([
      "/api/v1/summary",
      "/api/v1/up-next/movies",
      "/api/v1/up-next/shows",
    ]);

    const refs = JSON.stringify(spec).match(/#\/components\/schemas\/\w+/g)!;
    for (const ref of refs) {
      expect(spec.components.schemas, ref).toHaveProperty(
        ref.split("/").pop()!,
      );
    }
  });

  it("describes the site as JSON-LD that can't break out of its script tag", () => {
    expect(JSON_LD).toMatchObject({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "what.pm",
      url: "https://www.what.pm/",
      author: { "@type": "Person", name: "Nienke Dekker" },
    });
    expect(jsonLdScript({ name: "</script>" })).toBe(
      '{"name":"\\u003c/script>"}',
    );
  });
});

describe("aboutMarkdown", () => {
  it("leaves out the first year on an empty log", () => {
    const md = aboutMarkdown({
      total: 0,
      books: 0,
      movies: 0,
      shows: 0,
      firstYear: null,
      yearCount: 0,
      firstEntry: null,
    });
    expect(md).toContain("- 0 things logged across 0 years");
    expect(md).not.toContain("Logging since");
    expect(md).not.toContain("null");
  });
});
