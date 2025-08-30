// Application-wide constants

export const APP_NAME = "what." as const;

export const ITEM_TYPES = {
  BOOK: "Book",
  MOVIE: "Movie", 
  SHOW: "Show",
} as const;

export type ValidItemType = typeof ITEM_TYPES[keyof typeof ITEM_TYPES];

// Chart configuration for data visualization
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

// Order for sorting items by type
export const ITEM_TYPE_ORDER: Record<ValidItemType, number> = {
  [ITEM_TYPES.BOOK]: 1,
  [ITEM_TYPES.MOVIE]: 2,
  [ITEM_TYPES.SHOW]: 3,
};

// UI constants
export const SEARCH = {
  MIN_QUERY_LENGTH: 2,
  DEBOUNCE_DELAY: 300,
  MAX_RESULTS: 100,
} as const;

// Date constants
export const DATE_LIMITS = {
  MIN_YEAR: 1900,
  MAX_FUTURE_YEARS: 10,
} as const;