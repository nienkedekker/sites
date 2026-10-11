import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { CATEGORY_CONFIG, TYPE_NAMES } from "@/utils/constants/app";

const ROOT = join(import.meta.dirname, "..");
const HOME = "utils/constants/app.ts";

// Names a page could show for a type, spelled out as a string. They belong in
// TYPE_NAMES only; lowercase "books", "movies" and "shows" are also data keys
// (stats, the API), so those aren't looked for
const SPELLED_OUT =
  /(["'`])(Books|Movies|Films?|films|TV|TV ?[Ss]hows?|Shows|TV shows)\1/g;

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

describe("what the types are called", () => {
  it("comes from TYPE_NAMES alone", () => {
    const found = ["app", "components", "utils"]
      .flatMap((dir) => sources(join(ROOT, dir)))
      .filter((path) => relative(ROOT, path) !== HOME)
      .flatMap((path) =>
        [...readFileSync(path, "utf8").matchAll(SPELLED_OUT)].map(
          (match) => `${relative(ROOT, path)}: ${match[0]}`,
        ),
      );
    expect(found).toEqual([]);
  });

  it("names the log's columns as TYPE_NAMES does", () => {
    for (const { type, title } of CATEGORY_CONFIG) {
      expect(title).toBe(TYPE_NAMES[type].many);
    }
  });
});
