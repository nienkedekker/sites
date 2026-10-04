import { unstable_cache } from "next/cache";
import { nameKey } from "@/utils/data/names";
import { isOpenLibraryKey } from "@/utils/data/external-ids";
import { normalizeTitle } from "@/utils/data/patterns";
import type { Found, Suggestion } from "@/utils/data/recommend";
import {
  getJson,
  openLibraryJson,
  SOURCE_JOBS,
  tmdbUrl,
  yearOf,
} from "@/utils/server/external-api";

const CONCURRENCY = 5;
const WEEK = 7 * 24 * 60 * 60;

const remember = <A extends string[], R>(
  name: string,
  lookup: (...args: A) => Promise<R>,
) => unstable_cache(lookup, ["recs", name], { revalidate: WEEK });

async function mapLimit<T, R>(
  values: T[],
  limit: number,
  run: (value: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(values.length);
  let next = 0;
  const worker = async () => {
    while (next < values.length) {
      const at = next++;
      results[at] = await run(values[at]);
    }
  };
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

const mainTitle = (title: string) => normalizeTitle(title.split(":")[0]);

export interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  edition_count?: number;
}

export function matchBook(
  docs: OpenLibraryDoc[],
  title: string,
  author: string,
): OpenLibraryDoc | null {
  const matches = docs.filter(
    (doc) =>
      isOpenLibraryKey(doc.key) &&
      mainTitle(doc.title) === mainTitle(title) &&
      doc.author_name?.some((name) => nameKey(name) === nameKey(author)),
  );
  matches.sort((a, b) => (b.edition_count ?? 0) - (a.edition_count ?? 0));
  return matches[0] ?? null;
}

export interface TmdbResult {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  release_date?: string;
  first_air_date?: string;
  vote_count?: number;
}

export function matchScreen(
  results: TmdbResult[],
  title: string,
  year: number,
  now = new Date(),
): TmdbResult | null {
  const wanted = normalizeTitle(title);
  const matches = results.filter((result) => {
    const titles = [
      result.title,
      result.name,
      result.original_title,
      result.original_name,
    ].filter((t): t is string => Boolean(t));
    const released = result.release_date || result.first_air_date;
    const releasedYear = yearOf(released);
    return (
      titles.some((t) => normalizeTitle(t) === wanted) &&
      released !== undefined &&
      Date.parse(released) <= now.getTime() &&
      releasedYear !== null &&
      Math.abs(releasedYear - year) <= 1
    );
  });
  matches.sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0));
  return matches[0] ?? null;
}

const bookSearch = remember(
  "book-search",
  async (title: string, author: string) => {
    const url = new URL("https://openlibrary.org/search.json");
    url.searchParams.set("title", title);
    url.searchParams.set("author", author);
    url.searchParams.set(
      "fields",
      "key,title,author_name,first_publish_year,edition_count",
    );
    url.searchParams.set("limit", "10");
    const data = await openLibraryJson<{ docs: OpenLibraryDoc[] }>(url);
    return data.docs;
  },
);

const screenSearch = remember(
  "screen-search",
  async (kind: string, title: string) => {
    const data = await getJson<{ results: TmdbResult[] }>(
      tmdbUrl(`/search/${kind}`, { query: title }),
    );
    return data.results;
  },
);

const joinNames = (names: string[]) =>
  names.length > 0 ? [...new Set(names)].join(", ") : null;

const screenDetails = remember(
  "screen-details",
  async (itemtype: string, id: string) => {
    if (itemtype === "Movie") {
      const { crew } = await getJson<{
        crew: { job: string; name: string }[];
      }>(tmdbUrl(`/movie/${id}/credits`));
      return {
        creator: joinNames(
          crew.filter(({ job }) => job === "Director").map(({ name }) => name),
        ),
        based_on: joinNames(
          crew
            .filter(({ job }) => SOURCE_JOBS.has(job))
            .map(({ name }) => name),
        ),
      };
    }
    const show = await getJson<{
      created_by?: { name: string }[];
      aggregate_credits: { crew: { name: string; jobs: { job: string }[] }[] };
    }>(tmdbUrl(`/tv/${id}`, { append_to_response: "aggregate_credits" }));
    return {
      creator: joinNames(show.created_by?.map(({ name }) => name) ?? []),
      based_on: joinNames(
        show.aggregate_credits.crew
          .filter(({ jobs }) => jobs.some(({ job }) => SOURCE_JOBS.has(job)))
          .map(({ name }) => name),
      ),
    };
  },
);

async function find(suggestion: Suggestion): Promise<Found | null> {
  if (suggestion.itemtype === "Book") {
    const doc = matchBook(
      await bookSearch(suggestion.title, suggestion.creator),
      suggestion.title,
      suggestion.creator,
    );
    return doc
      ? {
          itemtype: "Book",
          external_id: doc.key,
          title: doc.title,
          creator: suggestion.creator,
          year: doc.first_publish_year ?? null,
        }
      : null;
  }
  const kind = suggestion.itemtype === "Movie" ? "movie" : "tv";
  const result = matchScreen(
    await screenSearch(kind, suggestion.title),
    suggestion.title,
    suggestion.year,
  );
  if (!result) return null;
  const id = String(result.id);
  const details = await screenDetails(suggestion.itemtype, id);
  return {
    itemtype: suggestion.itemtype,
    external_id: id,
    title: result.title ?? result.name ?? suggestion.title,
    creator: details.creator ?? suggestion.creator,
    year: yearOf(result.release_date || result.first_air_date),
    based_on: details.based_on,
  };
}

export function lookUp(suggestions: Suggestion[]) {
  return mapLimit(suggestions, CONCURRENCY, async (suggestion) => {
    try {
      return { suggestion, found: await find(suggestion) };
    } catch (error) {
      console.error("Recommendation lookup failed:", error);
      return { suggestion, found: null };
    }
  });
}
