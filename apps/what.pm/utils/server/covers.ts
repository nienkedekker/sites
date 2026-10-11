import "server-only";
import { cacheLife } from "next/cache";
import { getJson, posterUrl, tmdbUrl } from "@/utils/server/external-api";
import { isOpenLibraryKey, isTmdbId } from "@/utils/data/external-ids";
import type { ValidItemType } from "@/types/shared";

// A poster seldom changes, so it's looked up once a week
async function tmdbPoster(itemtype: "Movie" | "Show", id: string) {
  "use cache: remote";
  cacheLife("weeks");
  const data = await getJson<{ poster_path?: string | null }>(
    tmdbUrl(`/${itemtype === "Movie" ? "movie" : "tv"}/${id}`),
  );
  return posterUrl(data.poster_path);
}

// A cover for something kept only by its id: a book's from its Open Library
// work, asked to 404 rather than send a blank so the text cover takes over,
// and a movie's or show's poster from TMDB. Google Books ids get none
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
