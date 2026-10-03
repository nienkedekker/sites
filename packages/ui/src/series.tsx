import { formatPlural } from "./format";

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
