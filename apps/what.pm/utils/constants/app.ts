import type { ValidItemType } from "@/types/shared";

export const TYPE_NAMES: Record<
  ValidItemType,
  { one: string; many: string; inText: string }
> = {
  Book: { one: "Book", many: "Books", inText: "books" },
  Movie: { one: "Movie", many: "Movies", inText: "movies" },
  Show: { one: "TV Show", many: "TV Shows", inText: "TV shows" },
};

export const CATEGORY_CONFIG: ReadonlyArray<{
  title: string;
  type: ValidItemType;
}> = [
  { title: TYPE_NAMES.Book.many, type: "Book" },
  { title: TYPE_NAMES.Movie.many, type: "Movie" },
  { title: TYPE_NAMES.Show.many, type: "Show" },
] as const;

export const ITEM_TYPES = {
  BOOK: "Book",
  MOVIE: "Movie",
  SHOW: "Show",
} as const;

export const TAB_VALUES = {
  BOOK: "book",
  MOVIE: "movie",
  SHOW: "show",
} as const;

export type TabValue = (typeof TAB_VALUES)[keyof typeof TAB_VALUES];

export const CHART_CONFIG = {
  [ITEM_TYPES.BOOK]: {
    label: TYPE_NAMES.Book.many,
    color: "var(--books)",
  },
  [ITEM_TYPES.MOVIE]: {
    label: TYPE_NAMES.Movie.many,
    color: "var(--movies)",
  },
  [ITEM_TYPES.SHOW]: {
    label: TYPE_NAMES.Show.many,
    color: "var(--shows)",
  },
} as const;

export const ITEM_TYPE_ORDER: Record<ValidItemType, number> = {
  [ITEM_TYPES.BOOK]: 1,
  [ITEM_TYPES.MOVIE]: 2,
  [ITEM_TYPES.SHOW]: 3,
};

// Cached reads of the log carry this tag, so saving an item can refresh them
export const ITEMS_TAG = "items";
export const WANTED_TAG = "wanted";

export const OFFLINE_MESSAGE =
  "Couldn’t reach the server. Check your connection and try again.";
