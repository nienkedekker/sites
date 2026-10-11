import type { ValidItemType } from "@/types/shared";

interface Entry {
  itemtype: ValidItemType;
  external_id: string;
  title: string;
  creator: string | null;
  published_year: number | null;
}

export function byline(entry: Entry) {
  const made =
    entry.creator &&
    (entry.itemtype === "Book"
      ? `by ${entry.creator}`
      : entry.itemtype === "Movie"
        ? `dir. ${entry.creator}`
        : `created by ${entry.creator}`);
  return [made, entry.published_year].filter(Boolean).join(" · ");
}
