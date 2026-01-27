/**
 * These should match exactly what's stored in the database
 */
export const VALID_ITEM_TYPES = ["Book", "Movie", "Show"] as const;
export type ValidItemType = (typeof VALID_ITEM_TYPES)[number];

export function isValidItemType(value: unknown): value is ValidItemType {
  return (
    typeof value === "string" &&
    VALID_ITEM_TYPES.includes(value as ValidItemType)
  );
}

export interface BaseItem {
  id: string;
  title: string;
  itemtype: ValidItemType; // Strongly typed, not just string
  published_year: number;
  belongs_to_year: number;
  redo: boolean;
  created_at: string | null;
  updated_at: string | null;
  // Optional type-specific fields
  author?: string | null;
  director?: string | null;
  season?: number | null;
  in_progress?: boolean | null;
}

export type BookItem = BaseItem & {
  itemtype: "Book";
  author: string;
  director: null;
  season: null;
  in_progress: null;
};

export type MovieItem = BaseItem & {
  itemtype: "Movie";
  director: string;
  author: null;
  season: null;
  in_progress: null;
};

export type ShowItem = BaseItem & {
  itemtype: "Show";
  season: number;
  author: null;
  director: null;
  in_progress: boolean;
};

export type TypedItem = BookItem | MovieItem | ShowItem;

export function isBookItem(item: BaseItem): item is BookItem {
  return item.itemtype === "Book";
}

export function isMovieItem(item: BaseItem): item is MovieItem {
  return item.itemtype === "Movie";
}

export function isShowItem(item: BaseItem): item is ShowItem {
  return item.itemtype === "Show";
}

/**
 * Helper to convert database item to typed item with validation
 */
export function validateAndTypeItem(dbItem: unknown): TypedItem | null {
  if (!dbItem || typeof dbItem !== "object") {
    return null;
  }

  const item = dbItem as Record<string, unknown>;

  // Basic validation
  if (
    typeof item.id !== "string" ||
    typeof item.title !== "string" ||
    !isValidItemType(item.itemtype) ||
    typeof item.published_year !== "number" ||
    typeof item.belongs_to_year !== "number" ||
    typeof item.redo !== "boolean"
  ) {
    console.warn("Invalid item structure:", item);
    return null;
  }

  const baseItem: BaseItem = {
    id: item.id,
    title: item.title,
    itemtype: item.itemtype,
    published_year: item.published_year,
    belongs_to_year: item.belongs_to_year,
    redo: item.redo,
    created_at: typeof item.created_at === "string" ? item.created_at : null,
    updated_at: typeof item.updated_at === "string" ? item.updated_at : null,
    author: typeof item.author === "string" ? item.author : null,
    director: typeof item.director === "string" ? item.director : null,
    season: typeof item.season === "number" ? item.season : null,
    in_progress:
      typeof item.in_progress === "boolean" ? item.in_progress : null,
  };

  // Type-specific validation and typing
  switch (baseItem.itemtype) {
    case "Book":
      if (!baseItem.author) {
        console.warn("Book item missing author:", baseItem);
        return null;
      }
      return {
        ...baseItem,
        itemtype: "Book",
        author: baseItem.author,
        director: null,
        season: null,
        in_progress: null,
      } as BookItem;

    case "Movie":
      if (!baseItem.director) {
        console.warn("Movie item missing director:", baseItem);
        return null;
      }
      return {
        ...baseItem,
        itemtype: "Movie",
        director: baseItem.director,
        author: null,
        season: null,
        in_progress: null,
      } as MovieItem;

    case "Show":
      if (!baseItem.season) {
        console.warn("Show item missing season:", baseItem);
        return null;
      }
      return {
        ...baseItem,
        itemtype: "Show",
        season: baseItem.season,
        author: null,
        director: null,
        in_progress: baseItem.in_progress ?? false,
      } as ShowItem;

    default:
      console.warn("Unknown item type:", baseItem.itemtype);
      return null;
  }
}
