import type { ValidItemType } from "@/types/shared";

export const isOpenLibraryKey = (id: string) => /^\/works\/OL\d+W$/.test(id);
export const isGoogleVolumeId = (id: string) => /^[\w-]{12}$/.test(id);
export const isTmdbId = (id: string) => /^\d+$/.test(id);

export const isExternalId = (type: ValidItemType, id: string) =>
  type === "Book" ? isOpenLibraryKey(id) || isGoogleVolumeId(id) : isTmdbId(id);

// A book up next took without a match anywhere: kept under its title and
// author until a later lookup finds it. Nothing fetches details for these
const UNMATCHED = "unmatched:";

export const isUnmatched = (id: string) => id.startsWith(UNMATCHED);

export function unmatchedId(title: string, author: string) {
  const slug = `${title} ${author}`
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${UNMATCHED}${slug}`.slice(0, 100);
}
