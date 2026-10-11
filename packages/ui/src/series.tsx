import type { ReactNode } from "react";
import { formatPlural } from "./format";
import { tooltipAlign } from "./tooltip";

export type ItemType = "Book" | "Movie" | "Show";

export interface SeriesCounts {
  books: number;
  movies: number;
  shows: number;
}

export const SERIES = [
  { key: "books", type: "Book", label: "Books", noun: "book", swatch: "bg-books" },
  { key: "movies", type: "Movie", label: "Movies", noun: "movie", swatch: "bg-movies" },
  { key: "shows", type: "Show", label: "TV seasons", noun: "TV season", swatch: "bg-shows" },
] as const;

export const SWATCH: Record<ItemType, string> = {
  Book: "bg-books",
  Movie: "bg-movies",
  Show: "bg-shows",
};

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function describeCounts(counts: SeriesCounts, { skipZero = false } = {}) {
  return SERIES.filter(({ key }) => !skipZero || counts[key] > 0)
    .map(({ key, noun }) => formatPlural(counts[key], noun))
    .join(", ");
}

export function SeriesRows({
  counts,
  skipZero = false,
}: {
  counts: SeriesCounts;
  skipZero?: boolean;
}) {
  return SERIES.filter(({ key }) => !skipZero || counts[key] > 0).map(
    ({ key, label, swatch }) => (
      <p key={key} className="flex items-center gap-2">
        <span className={`size-2 ${swatch}`} />
        {label}
        <span className="ml-auto pl-3 tabular-nums">{counts[key]}</span>
      </p>
    ),
  );
}

// One bar of a chart: the series stacked, its total over the bar when it's
// the tallest, and the counts in a tooltip. The caller's wrapper is the group
// that shows the tooltip, so it can be a link or a focusable figure.
export function SeriesColumn({
  counts,
  top,
  peak = false,
  label,
  position,
}: {
  counts: SeriesCounts;
  top: number;
  peak?: boolean;
  label: ReactNode;
  position: number;
}) {
  const total = counts.books + counts.movies + counts.shows;
  const height = `${top > 0 ? (total / top) * 100 : 0}%`;

  return (
    <>
      {peak && total > 0 && (
        <span
          className="absolute font-mono text-2xs font-medium text-ink-soft tabular-nums"
          style={{ bottom: `calc(${height} + 4px)` }}
          aria-hidden="true"
        >
          {total}
        </span>
      )}
      <div
        className="flex w-3/4 max-w-6 flex-col gap-[2px] transition-opacity group-hover:opacity-80"
        style={{ height }}
      >
        {[...SERIES]
          .reverse()
          .filter(({ key }) => counts[key] > 0)
          .map(({ key, swatch }) => (
            <span
              key={key}
              className={swatch}
              style={{ flexGrow: counts[key], flexBasis: 0 }}
            />
          ))}
      </div>
      <div className={`tooltip ${tooltipAlign(position)}`} aria-hidden="true">
        <p className="mb-1 font-medium">{label}</p>
        {total > 0 ? (
          <SeriesRows counts={counts} skipZero />
        ) : (
          <p className="text-ink-soft">Nothing logged</p>
        )}
      </div>
    </>
  );
}
