import "server-only";
import { cacheLife } from "next/cache";
import { getJson, posterUrl, tmdbUrl } from "@/utils/server/external-api";
import {
  isGoogleVolumeId,
  isOpenLibraryKey,
  isTmdbId,
} from "@/utils/data/external-ids";
import type { ValidItemType } from "@/types/shared";

async function tmdbPoster(itemtype: "Movie" | "Show", id: string) {
  "use cache: remote";
  cacheLife("weeks");
  const data = await getJson<{ poster_path?: string | null }>(
    tmdbUrl(`/${itemtype === "Movie" ? "movie" : "tv"}/${id}`),
  );
  return posterUrl(data.poster_path);
}

// Google hands out http links, some with a page curl drawn on (edge=curl)
export function googleCoverUrl(thumbnail?: string | null) {
  if (!thumbnail) return null;
  const url = new URL(thumbnail.replace(/^http:/, "https:"));
  url.searchParams.delete("edge");
  return url.toString();
}

async function googleCover(id: string) {
  "use cache: remote";
  const url = new URL(`https://www.googleapis.com/books/v1/volumes/${id}`);
  url.searchParams.set("fields", "volumeInfo/imageLinks");
  url.searchParams.set("key", process.env.GOOGLE_API_KEY ?? "");
  const data = await getJson<{
    volumeInfo?: { imageLinks?: { thumbnail?: string } };
  }>(url);
  const cover = googleCoverUrl(data.volumeInfo?.imageLinks?.thumbnail);
  // Covers for upcoming books often arrive later
  if (cover) cacheLife("weeks");
  else cacheLife("days");
  return cover;
}

export async function coverOf({
  itemtype,
  external_id: id,
}: {
  itemtype: ValidItemType;
  external_id: string;
}): Promise<string | null> {
  if (itemtype === "Book") {
    if (isOpenLibraryKey(id)) {
      return `https://covers.openlibrary.org/w/olid/${id.slice("/works/".length)}-M.jpg?default=false`;
    }
    if (isGoogleVolumeId(id) && process.env.GOOGLE_API_KEY) {
      return googleCover(id).catch(() => null);
    }
    return null;
  }
  if (!isTmdbId(id) || !process.env.TMDB_API_KEY) return null;
  return tmdbPoster(itemtype, id).catch(() => null);
}
