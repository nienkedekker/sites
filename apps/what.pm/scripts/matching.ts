// The rules the backfill uses to decide which search result is the item I
// logged, kept apart from the fetching so they can be tested
import type { TypedItem } from "@/types/shared";
import { splitNames } from "@/utils/data/names";
import { normalizeTitle } from "@/utils/data/patterns";
import { yearOf } from "@/utils/server/external-api";

export interface Match {
  id: string;
  title: string;
  year: number | null;
  // "loose" matches are worth a look before trusting them
  confidence: "exact" | "loose";
}

export interface TmdbMovie {
  id: number;
  title: string;
  original_title?: string;
  release_date?: string;
}

export interface TmdbShow {
  id: number;
  name: string;
  original_name?: string;
  first_air_date?: string;
}

// Logged titles sometimes carry how I watched it ("3D", "IMAX", "(The Final
// Cut)") or a note ("(Q&A)"), which the sources don't have
export const cleanTitle = (title: string) =>
  title
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(IMAX|3D)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

// 2 for the same title, 1 when the source only adds a subtitle ("Wolf Hall:
// A Novel"), 0 otherwise. A logged "Mistborn: The Hero of Ages" never
// matches plain "Mistborn"
export function titleScore(
  logged: string,
  ...candidates: (string | undefined)[]
) {
  const wanted = normalizeTitle(cleanTitle(logged));
  let score = 0;
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (normalizeTitle(candidate) === wanted) return 2;
    // "Marvel's Runaways", "Tom Clancy's Jack Ryan"
    if (normalizeTitle(candidate.replace(/^[^:]*?['’]s\s+/, "")) === wanted) {
      return 2;
    }
    if (normalizeTitle(candidate.split(":")[0]) === wanted) score = 1;
  }
  return score;
}

// Full-title matches first, keeping the source's own ranking within each
export function byTitle<T>(items: T[], score: (item: T) => number) {
  return [
    ...items.filter((item) => score(item) === 2),
    ...items.filter((item) => score(item) === 1),
  ];
}

export const overlaps = (names: string | null | undefined, others: string[]) =>
  splitNames(names ?? null).some((name) =>
    others.some((other) => normalizeTitle(name) === normalizeTitle(other)),
  );

export interface OpenLibraryDoc {
  key: string;
  title: string;
  first_publish_year?: number;
  author_name?: string[];
}

// The title alone isn't enough: OpenLibrary also has study guides, critical
// editions and movie companions with the same title by someone else
export function pickBook(docs: OpenLibraryDoc[], item: TypedItem) {
  const byAuthor = docs.filter((doc) =>
    overlaps(item.author, doc.author_name ?? []),
  );
  const [match] = byTitle(byAuthor, (doc) => titleScore(item.title, doc.title));
  return match ?? null;
}

// "Dune" logged for 2021 should find Dune (2021) before Dune: Part Two. Only
// the exact year counts here: an "Inside" logged for 2021 is Bo Burnham's,
// not the 2023 film, so anything off by a year has to match on director
export function pickMovie(results: TmdbMovie[], item: TypedItem) {
  const score = (movie: TmdbMovie) =>
    titleScore(item.title, movie.title, movie.original_title);
  for (const level of [2, 1]) {
    const match = results.find(
      (movie) =>
        score(movie) === level &&
        yearOf(movie.release_date) === item.published_year,
    );
    if (match) return match;
  }
  return null;
}

// A season can't air before its show started. Only full titles count, so a
// spin-off ("The Expanse: One Ship") can't stand in for the show, and the
// exact spelling wins over one that only differs by "The". A first season
// airs the year its show starts (Marvel's Runaways 2017, not Runaways 2012).
// Otherwise TMDB's popularity order decides.
export function pickShow(results: TmdbShow[], item: TypedItem) {
  const wanted = cleanTitle(item.title).toLowerCase();
  const eligible = results
    .map((show) => ({ show, year: yearOf(show.first_air_date) }))
    .filter(
      ({ show, year }) =>
        titleScore(item.title, show.name, show.original_name) === 2 &&
        year !== null &&
        year <= item.published_year + 1,
    );
  const starting =
    item.season === 1
      ? eligible.filter(
          ({ year }) => Math.abs(year! - item.published_year) <= 1,
        )
      : [];
  const pool = starting.length > 0 ? starting : eligible;
  return (
    pool.find(({ show }) => show.name.toLowerCase() === wanted)?.show ??
    pool[0]?.show ??
    null
  );
}
