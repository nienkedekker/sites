import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReactNode } from "react";
import { cacheLife } from "next/cache";
import { formatPlural } from "@nienke/ui/format";
import { SITE_NAME } from "@/utils/constants/site";

export const OG_SIZE = { width: 1200, height: 630 };

export const COLORS = {
  paper: "#fcfcfd",
  ink: "#0b0c0e",
  soft: "#5d626c",
  line: "#e8e8ec",
  books: "#0b0c0e",
  movies: "#3242a8",
  shows: "#8b909a",
};

export const SERIES = [
  { key: "books", type: "Book", noun: "book", color: COLORS.books },
  { key: "movies", type: "Movie", noun: "movie", color: COLORS.movies },
  { key: "shows", type: "Show", noun: "TV season", color: COLORS.shows },
] as const;

type SeriesKey = (typeof SERIES)[number]["key"];
export type Counts = Record<SeriesKey, number>;

// Read from disk so the share images never depend on the network at build,
// and cached so reading them doesn't stop the images from prerendering
export async function loadFonts() {
  "use cache";
  cacheLife("max");
  const [serif, mono] = await Promise.all(
    ["InstrumentSerif-Regular.ttf", "GeistMono-Regular.ttf"].map((file) =>
      readFile(join(process.cwd(), "assets/fonts", file)).then(
        (buffer) => new Uint8Array(buffer).buffer,
      ),
    ),
  );
  return [
    { name: "Serif", data: serif, weight: 400 as const },
    { name: "Mono", data: mono, weight: 400 as const },
  ];
}

export function OgFrame({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: COLORS.paper,
        color: COLORS.ink,
        fontFamily: "Mono",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          fontSize: 26,
          color: COLORS.soft,
        }}
      >
        <span style={{ fontFamily: "Serif", fontSize: 48, color: COLORS.ink }}>
          what.
        </span>
        <span>{`${SITE_NAME}${path}`}</span>
      </div>
      {children}
    </div>
  );
}

export function Headline({
  children,
  size = 240,
}: {
  children: ReactNode;
  size?: number;
}) {
  return (
    <span
      style={{
        fontFamily: "Serif",
        fontSize: size,
        lineHeight: 0.8,
        letterSpacing: size / -40,
      }}
    >
      {children}
    </span>
  );
}

export function SeriesCounts({
  counts,
  nouns = {},
  skipZero = false,
}: {
  counts: Counts;
  // Up next lists whole shows, not seasons
  nouns?: Partial<Record<SeriesKey, string>>;
  skipZero?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        marginTop: 40,
        fontSize: 26,
      }}
    >
      {SERIES.filter(({ key }) => !skipZero || counts[key] > 0).map(
        ({ key, noun, color }) => (
          <div
            key={key}
            style={{ display: "flex", alignItems: "center", gap: 14 }}
          >
            <div style={{ width: 16, height: 16, background: color }} />
            <span>{formatPlural(counts[key], nouns[key] ?? noun)}</span>
          </div>
        ),
      )}
    </div>
  );
}

export function SeriesBars({
  counts,
  width = 500,
}: {
  counts: Counts;
  width?: number;
}) {
  const largest = Math.max(1, counts.books, counts.movies, counts.shows);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width }}>
      {SERIES.map(({ key, color }) => (
        <div
          key={key}
          style={{
            height: 40,
            width: `${(counts[key] / largest) * 100}%`,
            background: color,
          }}
        />
      ))}
    </div>
  );
}

export function countTypes(items: { itemtype: string }[]): Counts {
  return {
    books: items.filter((item) => item.itemtype === "Book").length,
    movies: items.filter((item) => item.itemtype === "Movie").length,
    shows: items.filter((item) => item.itemtype === "Show").length,
  };
}
