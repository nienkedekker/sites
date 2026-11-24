import "server-only";
import { cacheLife } from "next/cache";
import { nameKey } from "@/utils/data/names";
import { isGoogleVolumeId, isOpenLibraryKey } from "@/utils/data/external-ids";
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
  year?: number,
): OpenLibraryDoc | null {
  const matches = docs.filter(
    (doc) =>
      isOpenLibraryKey(doc.key) &&
      mainTitle(doc.title) === mainTitle(title) &&
      doc.author_name?.some((name) => nameKey(name) === nameKey(author)),
  );
  const inYear = (doc: OpenLibraryDoc) =>
    year &&
    doc.first_publish_year &&
    Math.abs(doc.first_publish_year - year) <= 1
      ? 1
      : 0;
  matches.sort(
    (a, b) =>
      inYear(b) - inYear(a) || (b.edition_count ?? 0) - (a.edition_count ?? 0),
  );
  return matches[0] ?? null;
}

export interface GoogleVolume {
  id: string;
  volumeInfo: { title?: string; authors?: string[]; publishedDate?: string };
}

export function matchGoogleBook(
  volumes: GoogleVolume[],
  title: string,
  author: string,
  year?: number,
): GoogleVolume | null {
  const matches = volumes.filter(
    ({ id, volumeInfo }) =>
      isGoogleVolumeId(id) &&
      volumeInfo.title !== undefined &&
      mainTitle(volumeInfo.title) === mainTitle(title) &&
      volumeInfo.authors?.some((name) => nameKey(name) === nameKey(author)),
  );
  const distance = ({ volumeInfo }: GoogleVolume) => {
    const published = yearOf(volumeInfo.publishedDate);
    return year && published ? Math.abs(published - year) : Infinity;
  };
  matches.sort((a, b) => distance(a) - distance(b));
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

async function bookSearch(title: string, author: string) {
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
}

async function googleBookSearch(title: string, author: string) {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) return [];
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", `${title} ${author}`);
  url.searchParams.set("printType", "books");
  url.searchParams.set("maxResults", "20");
  url.searchParams.set("key", key);
  const data = await getJson<{ items?: GoogleVolume[] }>(url);
  return data.items ?? [];
}

async function screenSearch(kind: string, title: string) {
  const data = await getJson<{ results: TmdbResult[] }>(
    tmdbUrl(`/search/${kind}`, { query: title }),
  );
  return data.results;
}

const joinNames = (names: string[]) =>
  names.length > 0 ? [...new Set(names)].join(", ") : null;

async function screenDetails(itemtype: string, id: string) {
  "use cache: remote";
  cacheLife("weeks");
  if (itemtype === "Movie") {
    const { crew } = await getJson<{
      crew: { job: string; name: string }[];
    }>(tmdbUrl(`/movie/${id}/credits`));
    return {
      creator: joinNames(
        crew.filter(({ job }) => job === "Director").map(({ name }) => name),
      ),
      based_on: joinNames(
        crew.filter(({ job }) => SOURCE_JOBS.has(job)).map(({ name }) => name),
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
}

// A miss is kept an hour, not weeks: a new release often turns up on Open
// Library or Google Books later, and the details cron should find it then
async function findBook(
  title: string,
  creator: string,
  year: number,
): Promise<Found | null> {
  "use cache: remote";
  // Open Library's title search finds nothing for a subtitle it doesn't
  // have ("Other Worlds Than These: A Talisman Novel"), so it gets the main
  // title only, the part matching compares anyway
  const mainPart = title.split(":")[0].trim();
  const doc = matchBook(
    await bookSearch(mainPart, creator),
    title,
    creator,
    year,
  );
  if (doc) {
    cacheLife("weeks");
    return {
      itemtype: "Book",
      external_id: doc.key,
      title: doc.title,
      creator,
      year: doc.first_publish_year ?? null,
    };
  }
  // Open Library adds new releases months late, Google Books has them
  // before they're out
  const volume = matchGoogleBook(
    await googleBookSearch(mainPart, creator),
    title,
    creator,
    year,
  );
  if (!volume) {
    cacheLife("hours");
    return null;
  }
  cacheLife("weeks");
  return {
    itemtype: "Book",
    external_id: volume.id,
    title: volume.volumeInfo.title ?? title,
    creator,
    year: yearOf(volume.volumeInfo.publishedDate),
  };
}

async function findScreen(
  itemtype: "Movie" | "Show",
  title: string,
  creator: string,
  year: number,
): Promise<Found | null> {
  "use cache: remote";
  const kind = itemtype === "Movie" ? "movie" : "tv";
  const result = matchScreen(await screenSearch(kind, title), title, year);
  if (!result) {
    cacheLife("hours");
    return null;
  }
  cacheLife("weeks");
  const id = String(result.id);
  const details = await screenDetails(itemtype, id);
  return {
    itemtype,
    external_id: id,
    title: result.title ?? result.name ?? title,
    creator: details.creator ?? creator,
    year: yearOf(result.release_date || result.first_air_date),
    based_on: details.based_on,
  };
}

const find = ({ itemtype, title, creator, year }: Suggestion) =>
  itemtype === "Book"
    ? findBook(title, creator, year)
    : findScreen(itemtype, title, creator, year);

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
