import type { ReactNode } from "react";
import { formatPlural } from "@nienke/ui/format";

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

// Without a browser user agent Google Fonts serves TTF, which satori can read
async function loadFont(family: string, weight: number, text: string) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`,
  ).then((res) => res.text());
  const url = css.match(/src: url\((.+?)\) format/)?.[1];
  if (!url) throw new Error(`No font file for ${family}`);
  return fetch(url).then((res) => res.arrayBuffer());
}

// Only the characters in `serif` and `mono` are fetched, so pass every
// string the image shows
export function loadFonts(serif: string, mono: string) {
  return Promise.all([
    loadFont("Instrument+Serif", 400, `${serif}what.`),
    loadFont("Geist+Mono", 400, `${mono}what.pm/0123456789,`),
  ])
    .then(([serifData, monoData]) => [
      { name: "Serif", data: serifData, weight: 400 as const },
      { name: "Mono", data: monoData, weight: 400 as const },
    ])
    .catch(() => []);
}

export const seriesText = SERIES.map(({ noun }) => `${noun}s`).join(" ");

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
        <span>{`what.pm${path}`}</span>
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
