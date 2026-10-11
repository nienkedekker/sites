import "server-only";
import { cacheLife } from "next/cache";
import { getJson, posterUrl, tmdbUrl } from "@/utils/server/external-api";
import { isOpenLibraryKey, isTmdbId } from "@/utils/data/external-ids";
import type { ValidItemType } from "@/types/shared";

async function tmdbPoster(itemtype: "Movie" | "Show", id: string) {
  "use cache: remote";
  cacheLife("weeks");
  const data = await getJson<{ poster_path?: string | null }>(
    tmdbUrl(`/${itemtype === "Movie" ? "movie" : "tv"}/${id}`),
  );
  return posterUrl(data.poster_path);
}

export async function coverOf({
  itemtype,
  external_id: id,
}: {
  itemtype: ValidItemType;
  external_id: string;
}): Promise<string | null> {
  if (itemtype === "Book") {
    return isOpenLibraryKey(id)
      ? `https://covers.openlibrary.org/w/olid/${id.slice("/works/".length)}-M.jpg?default=false`
      : null;
  }
  if (!isTmdbId(id) || !process.env.TMDB_API_KEY) return null;
  return tmdbPoster(itemtype, id).catch(() => null);
}
