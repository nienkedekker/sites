import type { TypedItem } from "@/types/shared";
import { splitNames } from "@/utils/data/names";
import {
  cleanTitle,
  overlaps,
  pickBook,
  pickMovie,
  pickShow,
  titleScore,
  type Match,
  type OpenLibraryDoc,
  type TmdbMovie,
  type TmdbShow,
} from "@/utils/data/matching";
import {
  getJson,
  openLibraryJson,
  tmdbUrl,
  yearOf,
} from "@/utils/server/external-api";

async function searchOpenLibrary(params: Record<string, string>) {
  const url = new URL("https://openlibrary.org/search.json");
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value);
  }
  url.searchParams.set("fields", "key,title,first_publish_year,author_name");
  url.searchParams.set("limit", "10");
  const data = await openLibraryJson<{ docs: OpenLibraryDoc[] }>(url);
  return data.docs;
}

export async function findBook(item: TypedItem): Promise<Match | null> {
  const title = cleanTitle(item.title);
  const author = splitNames(item.author)[0] ?? "";
  const toMatch = (doc: OpenLibraryDoc, confidence: Match["confidence"]) => ({
    id: doc.key,
    title: doc.title,
    year: doc.first_publish_year ?? null,
    confidence,
  });

  const byField = await searchOpenLibrary({ title, author });
  const exact = pickBook(byField, item);
  if (exact) return toMatch(exact, "exact");

  const broad = await searchOpenLibrary({ q: `${title} ${author}` });
  const broadExact = pickBook(broad, item);
  if (broadExact) return toMatch(broadExact, "exact");

  // Translations are often filed under the original title (海辺のカフカ for
  // Kafka on the Shore), so fall back to the best hit by the same author
  const byAuthor = broad.find(
    (doc) =>
      overlaps(item.author, doc.author_name ?? []) &&
      !/study guide|summary|analysis|sparknotes/i.test(doc.title),
  );
  return byAuthor ? toMatch(byAuthor, "loose") : null;
}

async function searchMovies(query: string) {
  const data = await getJson<{ results: TmdbMovie[] }>(
    tmdbUrl("/search/movie", { query, include_adult: "false" }),
  );
  return data.results;
}

async function directorsOf(id: number) {
  const data = await getJson<{ crew: { job: string; name: string }[] }>(
    tmdbUrl(`/movie/${id}/credits`),
  );
  return data.crew
    .filter((person) => person.job === "Director")
    .map((person) => person.name);
}

export async function findMovie(item: TypedItem): Promise<Match | null> {
  const title = cleanTitle(item.title);
  const results = await searchMovies(title);
  const toMatch = (movie: TmdbMovie, confidence: Match["confidence"]) => ({
    id: String(movie.id),
    title: movie.title,
    year: yearOf(movie.release_date),
    confidence,
  });

  // Even the right title and year can be a different film (there's more than
  // one Teeth and Birdman), so the director has to match too
  const picked = pickMovie(results, item);
  if (picked && overlaps(item.director, await directorsOf(picked.id))) {
    return toMatch(picked, "exact");
  }

  // Titles that don't line up ("Star Wars I: The Phantom Menace", "Mad Max:
  // Furiosa") or years that are off: accept a result if the director matches
  const queries = [
    ...new Set([title, ...title.split(":").map((part) => part.trim())]),
  ].filter((query) => query.length > 2);
  const candidates = new Map<number, TmdbMovie>();
  for (const query of queries) {
    const found = query === title ? results : await searchMovies(query);
    for (const movie of found.slice(0, 5)) candidates.set(movie.id, movie);
  }

  for (const movie of candidates.values()) {
    const year = yearOf(movie.release_date);
    const sameTitle =
      titleScore(item.title, movie.title, movie.original_title) > 0;
    const closeYear =
      year !== null && Math.abs(year - item.published_year) <= 1;
    if (!sameTitle && !closeYear) continue;
    if (overlaps(item.director, await directorsOf(movie.id))) {
      return toMatch(movie, sameTitle ? "exact" : "loose");
    }
  }
  return null;
}

export async function findShow(item: TypedItem): Promise<Match | null> {
  const data = await getJson<{ results: TmdbShow[] }>(
    tmdbUrl("/search/tv", {
      query: cleanTitle(item.title),
      include_adult: "false",
    }),
  );
  const match = pickShow(data.results, item);
  return match
    ? {
        id: String(match.id),
        title: match.name,
        year: yearOf(match.first_air_date),
        confidence: "exact",
      }
    : null;
}

export const findMatch = (item: TypedItem) =>
  item.itemtype === "Book"
    ? findBook(item)
    : item.itemtype === "Movie"
      ? findMovie(item)
      : findShow(item);
