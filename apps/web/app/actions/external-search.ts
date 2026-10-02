"use server";

import { createClientForServer } from "@/utils/supabase/server";
import { ITEM_TYPES } from "@/utils/constants/app";
import type { ValidItemType } from "@/types/shared";
import type { ExternalResult, SeasonYears } from "@/types/external-api";

const TMDB = "https://api.themoviedb.org/3";
const LIMIT = 6;

async function isSignedIn() {
  const supabase = await createClientForServer();
  const { data } = await supabase.auth.getUser();
  return Boolean(data.user);
}

const yearOf = (date?: string) =>
  date ? Number(date.slice(0, 4)) || null : null;

async function getJson<T>(url: URL, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${url.hostname} responded ${res.status}`);
  return res.json();
}

function tmdbUrl(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${TMDB}${path}`);
  url.searchParams.set("api_key", process.env.TMDB_API_KEY ?? "");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url;
}

async function searchBooks(query: string): Promise<ExternalResult[]> {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("fields", "key,title,author_name,first_publish_year");
  url.searchParams.set("limit", String(LIMIT));

  const data = await getJson<{
    docs: {
      key: string;
      title: string;
      author_name?: string[];
      first_publish_year?: number;
    }[];
  }>(url, { headers: { "User-Agent": "what.pm (https://what.pm)" } });

  return data.docs.map((doc) => ({
    id: doc.key,
    title: doc.title,
    year: doc.first_publish_year ?? null,
    creator: doc.author_name?.[0] ?? null,
  }));
}

async function directorsOf(id: number) {
  const data = await getJson<{ crew: { job: string; name: string }[] }>(
    tmdbUrl(`/movie/${id}/credits`),
  );
  const names = data.crew
    .filter((person) => person.job === "Director")
    .map((person) => person.name);
  return names.length > 0 ? names.join(", ") : null;
}

type Movie = { id: number; title: string; release_date?: string };

async function moviesDirectedBy(query: string): Promise<Movie[]> {
  const words = query.toLowerCase().split(/\s+/);
  const people = await getJson<{ results: { id: number; name: string }[] }>(
    tmdbUrl("/search/person", { query, include_adult: "false" }),
  );
  const person = people.results.find((result) =>
    words.every((word) => result.name.toLowerCase().includes(word)),
  );
  if (!person) return [];

  const credits = await getJson<{
    crew: (Movie & { job: string; popularity: number })[];
  }>(tmdbUrl(`/person/${person.id}/movie_credits`));
  const today = new Date().toISOString().slice(0, 10);

  return credits.crew
    .filter(
      (movie) =>
        movie.job === "Director" &&
        movie.release_date &&
        movie.release_date <= today,
    )
    .filter((movie, i, all) => all.findIndex((m) => m.id === movie.id) === i)
    .sort((a, b) => b.popularity - a.popularity);
}

async function searchMovies(query: string): Promise<ExternalResult[]> {
  const [byTitle, byDirector] = await Promise.all([
    getJson<{ results: Movie[] }>(
      tmdbUrl("/search/movie", { query, include_adult: "false" }),
    ).then((data) => data.results),
    moviesDirectedBy(query).catch(() => []),
  ]);
  const exactTitle = byTitle.some(
    (movie) => movie.title.toLowerCase() === query.toLowerCase(),
  );
  const movies = byDirector.length > 0 && !exactTitle ? byDirector : byTitle;

  return Promise.all(
    movies.slice(0, LIMIT).map(async (movie) => ({
      id: String(movie.id),
      title: movie.title,
      year: yearOf(movie.release_date),
      creator: await directorsOf(movie.id).catch(() => null),
    })),
  );
}

async function searchShows(query: string): Promise<ExternalResult[]> {
  const data = await getJson<{
    results: { id: number; name: string; first_air_date?: string }[];
  }>(tmdbUrl("/search/tv", { query, include_adult: "false" }));

  return data.results.slice(0, LIMIT).map((show) => ({
    id: String(show.id),
    title: show.name,
    year: yearOf(show.first_air_date),
    creator: null,
  }));
}

export async function searchTitles(
  type: ValidItemType,
  query: string,
): Promise<ExternalResult[] | null> {
  const trimmed = query.trim();
  if (trimmed.length < 2 || trimmed.length > 200) return [];
  if (!(await isSignedIn())) return [];
  if (type !== ITEM_TYPES.BOOK && !process.env.TMDB_API_KEY) return [];

  try {
    if (type === ITEM_TYPES.BOOK) return await searchBooks(trimmed);
    if (type === ITEM_TYPES.MOVIE) return await searchMovies(trimmed);
    return await searchShows(trimmed);
  } catch (error) {
    console.error("Title search failed:", error);
    return null;
  }
}

export async function getSeasonYears(showId: string): Promise<SeasonYears> {
  if (!/^\d+$/.test(showId) || !process.env.TMDB_API_KEY) return {};
  if (!(await isSignedIn())) return {};

  try {
    const data = await getJson<{
      seasons: { season_number: number; air_date?: string | null }[];
    }>(tmdbUrl(`/tv/${showId}`));

    const years: SeasonYears = {};
    for (const season of data.seasons) {
      const year = yearOf(season.air_date ?? undefined);
      if (season.season_number > 0 && year) years[season.season_number] = year;
    }
    return years;
  } catch (error) {
    console.error("Season lookup failed:", error);
    return {};
  }
}
