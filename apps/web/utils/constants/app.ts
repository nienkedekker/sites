import { VALID_ITEM_TYPES, type ValidItemType } from "@/types/shared";

export const ITEM_TYPES = {
  BOOK: "Book",
  MOVIE: "Movie",
  SHOW: "Show",
} as const;

// Re-export from shared types for consistency
export { VALID_ITEM_TYPES };

export const CHART_CONFIG = {
  [ITEM_TYPES.BOOK]: {
    label: "Books",
    color: "hsl(var(--chart-1))",
  },
  [ITEM_TYPES.MOVIE]: {
    label: "Movies",
    color: "hsl(var(--chart-3))",
  },
  [ITEM_TYPES.SHOW]: {
    label: "Shows",
    color: "hsl(var(--chart-5))",
  },
} as const;

export const ITEM_TYPE_ORDER: Record<ValidItemType, number> = {
  [ITEM_TYPES.BOOK]: 1,
  [ITEM_TYPES.MOVIE]: 2,
  [ITEM_TYPES.SHOW]: 3,
};
