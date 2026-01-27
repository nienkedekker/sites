import type { ValidItemType } from "@/types/items";

/**
 * Category configuration for displaying items grouped by type.
 * Single source of truth used by item lists and search results.
 */
export const CATEGORY_CONFIG: ReadonlyArray<{
  title: string;
  type: ValidItemType;
}> = [
  { title: "Books", type: "Book" },
  { title: "Movies", type: "Movie" },
  { title: "TV Shows", type: "Show" },
] as const;
