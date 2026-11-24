import type { TypedItem } from "@/types/shared";
import type { ExternalDetails } from "@/utils/server/external-api";

export type Need = "match" | "length" | "genres";

export function needOf(item: TypedItem): Need | null {
  if (!item.external_id) return "match";
  const length = item.itemtype === "Book" ? item.pages : item.runtime_minutes;
  if (!length) return "length";
  if (item.genres.length === 0) return "genres";
  return null;
}

export interface Patch {
  external_id?: string;
  pages?: number;
  runtime_minutes?: number;
  based_on?: string;
  genres?: string[];
}

// Never overwrites: a page count or genre I entered stays, even when the
// source disagrees
export function patchFor(
  item: TypedItem,
  details: Partial<ExternalDetails>,
  externalId?: string,
): Patch | null {
  const patch: Patch = {};
  if (externalId && !item.external_id) patch.external_id = externalId;
  if (details.pages && !item.pages) patch.pages = details.pages;
  if (details.runtime_minutes && !item.runtime_minutes) {
    patch.runtime_minutes = details.runtime_minutes;
  }
  if (details.based_on && !item.based_on) patch.based_on = details.based_on;
  if (details.genres?.length && item.genres.length === 0) {
    patch.genres = details.genres;
  }
  return Object.keys(patch).length > 0 ? patch : null;
}
