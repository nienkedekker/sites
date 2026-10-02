import type { ValidItemType } from "@/types/shared";

const TMDB = "https://api.themoviedb.org/3";
const OPEN_LIBRARY_HEADERS = { "User-Agent": "what.pm (https://what.pm)" };
// TMDB writing credits that point at a book behind the movie or show
const SOURCE_JOBS = new Set([
  "Novel",
  "Book",
  "Short Story",
  "Characters",
  "Comic Book",
  "Graphic Novel",
  "Author",
]);

export const yearOf = (date?: string) =>
  date ? Number(date.slice(0, 4)) || null : null;

export async function getJson<T>(url: URL, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
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
}

const NO_DETAILS: ExternalDetails = {
  pages: null,
  runtime_minutes: null,
  based_on: null,
};

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

const joinNames = (names: string[]) =>
  names.length > 0 ? [...new Set(names)].join(", ") : null;

async function bookDetails(workKey: string): Promise<ExternalDetails> {
  const data = await openLibraryJson<{
    entries: { number_of_pages?: number }[];
  }>(new URL(`https://openlibrary.org${workKey}/editions.json?limit=50`));
  const pages = data.entries
    .map((edition) => edition.number_of_pages)
    .filter((count): count is number => !!count && count > 0);
  return { ...NO_DETAILS, pages: median(pages) };
}

async function movieDetails(id: string): Promise<ExternalDetails> {
  const data = await getJson<{
    runtime?: number;
    credits: { crew: { job: string; name: string }[] };
  }>(tmdbUrl(`/movie/${id}`, { append_to_response: "credits" }));
  return {
    ...NO_DETAILS,
    runtime_minutes: data.runtime || null,
    based_on: joinNames(
      data.credits.crew
        .filter((person) => SOURCE_JOBS.has(person.job))
        .map((person) => person.name),
    ),
  };
}

async function showDetails(
  id: string,
  season: number | null,
): Promise<ExternalDetails> {
  const [episodes, credits] = await Promise.all([
    season
      ? getJson<{ episodes: { runtime?: number | null }[] }>(
          tmdbUrl(`/tv/${id}/season/${season}`),
        ).then((data) => data.episodes)
      : Promise.resolve([]),
    getJson<{ crew: { name: string; jobs: { job: string }[] }[] }>(
      tmdbUrl(`/tv/${id}/aggregate_credits`),
    ),
  ]);
  const runtime = episodes.reduce((sum, ep) => sum + (ep.runtime ?? 0), 0);
  return {
    ...NO_DETAILS,
    runtime_minutes: runtime || null,
    based_on: joinNames(
      credits.crew
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
      if (!/^\/works\/OL\d+W$/.test(externalId)) return NO_DETAILS;
      return await bookDetails(externalId);
    }
    if (!/^\d+$/.test(externalId) || !process.env.TMDB_API_KEY) {
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
