import type { ValidItemType } from "@/types/shared";

export const CATEGORY_CONFIG: ReadonlyArray<{
  title: string;
  type: ValidItemType;
}> = [
  { title: "Books", type: "Book" },
  { title: "Movies", type: "Movie" },
  { title: "TV Shows", type: "Show" },
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
    label: "Books",
    color: "var(--books)",
  },
  [ITEM_TYPES.MOVIE]: {
    label: "Movies",
    color: "var(--movies)",
  },
  [ITEM_TYPES.SHOW]: {
    label: "Shows",
    color: "var(--shows)",
  },
} as const;

export const ITEM_TYPE_ORDER: Record<ValidItemType, number> = {
  [ITEM_TYPES.BOOK]: 1,
  [ITEM_TYPES.MOVIE]: 2,
  [ITEM_TYPES.SHOW]: 3,
};

export const HIDDEN_PEOPLE: ReadonlySet<string> = new Set([
  "Christopher Nolan",
]);
