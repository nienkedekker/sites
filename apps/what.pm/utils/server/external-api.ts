import type { ValidItemType } from "@/types/shared";
import { nameKey, splitNames } from "@/utils/data/names";
import { normalizeTitle } from "@/utils/data/patterns";
import {
  isGoogleVolumeId,
  isOpenLibraryKey,
  isTmdbId,
} from "@/utils/data/external-ids";
import { bookGenres } from "@/utils/data/book-genres";
import { SITE_NAME, SITE_URL } from "@/utils/constants/site";

const TMDB = "https://api.themoviedb.org/3";
const OPEN_LIBRARY_HEADERS = { "User-Agent": `${SITE_NAME} (${SITE_URL})` };
// TMDB writing credits that point at a book behind the movie or show
export const SOURCE_JOBS = new Set([
  "Novel",
  "Book",
  "Short Story",
  "Characters",
  "Comic Book",
  "Graphic Novel",
  "Author",
]);
// TV has a few combined genres where movies have two, so they're stored under
// the movie names. "TV Movie" says where it aired, not what it is.
const TV_GENRES: Record<string, string[]> = {
  "Action & Adventure": ["Action", "Adventure"],
  "Sci-Fi & Fantasy": ["Science Fiction", "Fantasy"],
};
const NOT_GENRES = new Set(["TV Movie"]);

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

export const yearOf = (date?: string) =>
  date ? Number(date.slice(0, 4)) || null : null;

// A hanging API shouldn't hold up saving an item or the recs page
const FETCH_TIMEOUT = 8_000;

export async function getJson<T>(url: URL, init: RequestInit = {}): Promise<T> {
  const timeout = AbortSignal.timeout(FETCH_TIMEOUT);
  const signal = init.signal
    ? AbortSignal.any([init.signal, timeout])
    : timeout;
  const res = await fetch(url, { ...init, signal });
  if (!res.ok) throw new Error(`${url.hostname} responded ${res.status}`);
  return res.json();
}

export function tmdbUrl(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB}${path}`);
  url.searchParams.set("api_key", process.env.TMDB_API_KEY ?? "");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url;
}

export function openLibraryJson<T>(url: URL) {
  return getJson<T>(url, { headers: OPEN_LIBRARY_HEADERS });
}

export interface ExternalDetails {
  pages: number | null;
  runtime_minutes: number | null;
  based_on: string | null;
  genres: string[];
}

const NO_DETAILS: ExternalDetails = {
  pages: null,
  runtime_minutes: null,
  based_on: null,
  genres: [],
};

// Some editions list 1 page, or 8, as a placeholder. Enough of them drag the
// median down to that, so anything this short doesn't count
const MIN_PAGES = 20;
const isPageCount = (count?: number): count is number =>
  !!count && count >= MIN_PAGES;

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

const joinNames = (names: string[]) =>
  names.length > 0 ? [...new Set(names)].join(", ") : null;

export const genreNames = (genres: { name: string }[] = []) => [
  ...new Set(
    genres
      .flatMap(({ name }) => TV_GENRES[name] ?? [name])
      .filter((name) => !NOT_GENRES.has(name)),
  ),
];

async function bookDetails(workKey: string): Promise<ExternalDetails> {
  const [data, work] = await Promise.all([
    openLibraryJson<{ entries: { number_of_pages?: number }[] }>(
      new URL(`https://openlibrary.org${workKey}/editions.json?limit=50`),
    ),
    openLibraryJson<{ subjects?: string[] }>(
      new URL(`https://openlibrary.org${workKey}.json`),
    ).catch(() => ({ subjects: [] })),
  ]);
  const pages = data.entries
    .map((edition) => edition.number_of_pages)
    .filter(isPageCount);
  return {
    ...NO_DETAILS,
    pages: median(pages),
    genres: bookGenres(work.subjects),
  };
}

interface GoogleVolume {
  volumeInfo: { title?: string; authors?: string[]; pageCount?: number };
}

const mainTitle = (title: string) => normalizeTitle(title.split(":")[0]);

// OpenLibrary rarely has page counts for new releases, Google Books usually
// does. Its intitle:/inauthor: filters come back empty, so this searches
// plain text and matches the title and author itself.
export async function googleBooksPages(
  title: string,
  author: string | null,
): Promise<number | null> {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) return null;
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", `${title.split(":")[0]} ${author ?? ""}`.trim());
  url.searchParams.set("printType", "books");
  url.searchParams.set("maxResults", "20");
  url.searchParams.set("key", key);

  try {
    // It answers 503 now and then, and a second try usually works
    const data = await getJson<{ items?: GoogleVolume[] }>(url).catch(() =>
      sleep(1000).then(() => getJson<{ items?: GoogleVolume[] }>(url)),
    );
    const authors = new Set(splitNames(author).map(nameKey));
    const pages = (data.items ?? [])
      .map((item) => item.volumeInfo)
      .filter(
        (volume) =>
          volume.title &&
          mainTitle(volume.title) === mainTitle(title) &&
          volume.authors?.some((name) => authors.has(nameKey(name))),
      )
      .map((volume) => volume.pageCount)
      .filter(isPageCount);
    return median(pages);
  } catch (error) {
    console.error("Google Books lookup failed:", error);
    return null;
  }
}

async function googleVolumeDetails(id: string): Promise<ExternalDetails> {
  const url = new URL(`https://www.googleapis.com/books/v1/volumes/${id}`);
  url.searchParams.set("key", process.env.GOOGLE_API_KEY ?? "");
  const { volumeInfo } = await getJson<{
    volumeInfo: {
      pageCount?: number;
      printedPageCount?: number;
      categories?: string[];
    };
  }>(url);
  // Search results often leave pageCount out when the volume itself has it
  const pages = [volumeInfo.pageCount, volumeInfo.printedPageCount].find(
    isPageCount,
  );
  return {
    ...NO_DETAILS,
    pages: pages ?? null,
    genres: bookGenres(volumeInfo.categories),
  };
}

async function movieDetails(id: string): Promise<ExternalDetails> {
  const data = await getJson<{
    runtime?: number;
    genres?: { name: string }[];
    credits: { crew: { job: string; name: string }[] };
  }>(tmdbUrl(`/movie/${id}`, { append_to_response: "credits" }));
  return {
    ...NO_DETAILS,
    runtime_minutes: data.runtime || null,
    genres: genreNames(data.genres),
    based_on: joinNames(
      data.credits.crew
        .filter((person) => SOURCE_JOBS.has(person.job))
        .map((person) => person.name),
    ),
  };
}

export interface Episode {
  runtime?: number | null;
  air_date?: string | null;
}

const COUR_GAP_DAYS = 180;

// Splits a season into the runs that aired with more than half a year in
// between. TMDB often files a whole anime as one long season, so its parts
// only show up as gaps in the air dates.
export function splitIntoCours(episodes: Episode[]): Episode[][] {
  const cours: Episode[][] = [];
  let lastAired: number | null = null;
  for (const episode of episodes) {
    const aired = episode.air_date ? Date.parse(episode.air_date) : null;
    const gap =
      aired !== null && lastAired !== null
        ? (aired - lastAired) / 86_400_000
        : 0;
    if (cours.length === 0 || gap > COUR_GAP_DAYS) cours.push([]);
    cours[cours.length - 1].push(episode);
    if (aired !== null) lastAired = aired;
  }
  return cours;
}

const sumRuntime = (episodes: Episode[]) =>
  episodes.reduce((sum, ep) => sum + (ep.runtime ?? 0), 0) || null;

async function seasonRuntime(
  id: string,
  season: number,
  seasons: { season_number: number }[],
) {
  const numbers = seasons
    .map((s) => s.season_number)
    .filter((number) => number > 0);
  const episodesOf = (number: number) =>
    getJson<{ episodes: Episode[] }>(
      tmdbUrl(`/tv/${id}/season/${number}`),
    ).then((data) => data.episodes);

  if (numbers.length > 1 && numbers.includes(season)) {
    return sumRuntime(await episodesOf(season));
  }

  // A single TMDB season, or one I'm past: the season I logged is one of the
  // parts of TMDB's last season (My Dress-Up Darling S2 is its S1, eps 13–24)
  const last = Math.max(0, ...numbers);
  if (last === 0) return null;
  const part = numbers.includes(season) ? 0 : season - last;
  const cours = splitIntoCours(await episodesOf(last));
  return cours[part] ? sumRuntime(cours[part]) : null;
}

async function showDetails(
  id: string,
  season: number | null,
): Promise<ExternalDetails> {
  const show = await getJson<{
    seasons?: { season_number: number }[];
    genres?: { name: string }[];
    aggregate_credits: { crew: { name: string; jobs: { job: string }[] }[] };
  }>(tmdbUrl(`/tv/${id}`, { append_to_response: "aggregate_credits" }));
  const runtime = season
    ? await seasonRuntime(id, season, show.seasons ?? []).catch(() => null)
    : null;
  return {
    ...NO_DETAILS,
    runtime_minutes: runtime,
    genres: genreNames(show.genres),
    based_on: joinNames(
      show.aggregate_credits.crew
        .filter((person) => person.jobs.some(({ job }) => SOURCE_JOBS.has(job)))
        .map((person) => person.name),
    ),
  };
}

export async function getExternalDetails(
  type: ValidItemType,
  externalId: string,
  season: number | null = null,
): Promise<ExternalDetails> {
  try {
    if (type === "Book") {
      if (isOpenLibraryKey(externalId)) return await bookDetails(externalId);
      if (isGoogleVolumeId(externalId) && process.env.GOOGLE_API_KEY) {
        return await googleVolumeDetails(externalId);
      }
      return NO_DETAILS;
    }
    if (!isTmdbId(externalId) || !process.env.TMDB_API_KEY) {
      return NO_DETAILS;
    }
    return type === "Movie"
      ? await movieDetails(externalId)
      : await showDetails(externalId, season);
  } catch (error) {
    console.error("External details lookup failed:", error);
    return NO_DETAILS;
  }
}
