import "server-only";
import { cacheLife } from "next/cache";
import { getUpNext } from "@/utils/data/up-next";
import { getJson, tmdbUrl } from "@/utils/server/external-api";


export interface UpNextMovie {
  id: number;
  title: string;
}

export interface UpNextShow {
  tvdbId: number;
  title: string;
}

export interface UpNextBook {
  id: string;
  title: string;
  author: string | null;
  year: number | null;
}

export async function upNextMovies(): Promise<UpNextMovie[]> {
  const upNext = await getUpNext();
  return upNext
    .filter((item) => item.itemtype === "Movie")
    .map((item) => ({ id: Number(item.external_id), title: item.title }));
}

export async function upNextBooks(): Promise<UpNextBook[]> {
  const upNext = await getUpNext();
  return upNext
    .filter((item) => item.itemtype === "Book")
    .map((item) => ({
      id: item.external_id,
      title: item.title,
      author: item.creator,
      year: item.published_year,
    }));
}

async function tvdbIdOf(tmdbId: string) {
  "use cache: remote";
  cacheLife("max");
  const ids = await getJson<{ tvdb_id?: number | null }>(
    tmdbUrl(`/tv/${tmdbId}/external_ids`),
  );
  return ids.tvdb_id ?? null;
}

// A show TVDB doesn't know, or a lookup that fails, is left off this time
// rather than failing the whole list
export async function upNextShows(): Promise<UpNextShow[]> {
  const shows = (await getUpNext()).filter((item) => item.itemtype === "Show");
  const ids = await Promise.allSettled(
    shows.map((show) => tvdbIdOf(show.external_id)),
  );
  return shows.flatMap((show, i) => {
    const result = ids[i];
    if (result.status === "rejected") {
      console.error("No TVDB id for", show.title, ":", result.reason);
      return [];
    }
    return result.value ? [{ tvdbId: result.value, title: show.title }] : [];
  });
}
