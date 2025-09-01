import { z } from "zod";
import { getCurrentYear } from "@/utils/formatters/date";

/**
 * Item Types - Single source of truth
 */
export const VALID_ITEM_TYPES = ["Book", "Movie", "Show"] as const;
export type ValidItemType = (typeof VALID_ITEM_TYPES)[number];

/**
 * Type guard to check if a value is a valid item type
 */
export function isValidItemType(value: unknown): value is ValidItemType {
  return (
    typeof value === "string" &&
    VALID_ITEM_TYPES.includes(value as ValidItemType)
  );
}

/**
 * Zod Schemas - Source of truth for validation and types
 */

// Year validation schema
const yearSchema = z
  .number()
  .int()
  .min(1600, "Year must be 1600 or later")
  .max(
    getCurrentYear() + 10,
    `Year must be ${getCurrentYear() + 10} or earlier`,
  );

// Base database item schema (includes all fields that exist in DB)
export const baseItemDbSchema = z.object({
  id: z.string(),
  title: z.string(),
  itemtype: z.enum(VALID_ITEM_TYPES),
  published_year: z.number().int(),
  belongs_to_year: z.number().int(),
  redo: z.boolean(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  // Optional type-specific fields (nullable in DB)
  author: z.string().nullable(),
  director: z.string().nullable(),
  season: z.number().int().nullable(),
});

// Base form input schema (for user input validation)
export const baseItemFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  itemtype: z.enum(VALID_ITEM_TYPES, {
    message: "Invalid item type",
  }),
  publishedYear: yearSchema,
  redo: z.boolean(),
});

// Type-specific schemas for forms
export const bookItemFormSchema = baseItemFormSchema.extend({
  itemtype: z.literal("Book"),
  author: z
    .string()
    .trim()
    .min(1, "Author is required for books")
    .max(100, "Author must be 100 characters or less"),
});

export const movieItemFormSchema = baseItemFormSchema.extend({
  itemtype: z.literal("Movie"),
  director: z
    .string()
    .trim()
    .min(1, "Director is required for movies")
    .max(100, "Director must be 100 characters or less"),
});

export const showItemFormSchema = baseItemFormSchema.extend({
  itemtype: z.literal("Show"),
  season: z
    .number()
    .int()
    .min(1, "Season must be at least 1")
    .max(50, "Season must be 50 or less"),
});

// Discriminated union for form validation
export const itemFormSchema = z.discriminatedUnion("itemtype", [
  bookItemFormSchema,
  movieItemFormSchema,
  showItemFormSchema,
]);

/**
 * TypeScript types derived from Zod schemas
 */

// Database types (what comes from/goes to database)
export type BaseItem = z.infer<typeof baseItemDbSchema>;

// Discriminated union types for database items
export type BookItem = BaseItem & {
  itemtype: "Book";
  author: string;
  director: null;
  season: null;
};

export type MovieItem = BaseItem & {
  itemtype: "Movie";
  director: string;
  author: null;
  season: null;
};

export type ShowItem = BaseItem & {
  itemtype: "Show";
  season: number;
  author: null;
  director: null;
};

export type Item = BookItem | MovieItem | ShowItem;

// Form input types (what users submit)
export type BaseItemInput = z.infer<typeof baseItemFormSchema>;
export type BookItemInput = z.infer<typeof bookItemFormSchema>;
export type MovieItemInput = z.infer<typeof movieItemFormSchema>;
export type ShowItemInput = z.infer<typeof showItemFormSchema>;
export type ItemInput = z.infer<typeof itemFormSchema>;

/**
 * Type guards for discriminated unions
 */
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
 * Validation helper for database items
 */
export function validateDatabaseItem(dbItem: unknown): Item | null {
  try {
    const validated = baseItemDbSchema.parse(dbItem);

    // Type-specific validation
    switch (validated.itemtype) {
      case "Book":
        if (!validated.author) {
          console.warn("Book item missing author:", validated);
          return null;
        }
        return {
          ...validated,
          itemtype: "Book",
          author: validated.author,
          director: null,
          season: null,
        } as BookItem;

      case "Movie":
        if (!validated.director) {
          console.warn("Movie item missing director:", validated);
          return null;
        }
        return {
          ...validated,
          itemtype: "Movie",
          director: validated.director,
          author: null,
          season: null,
        } as MovieItem;

      case "Show":
        if (!validated.season) {
          console.warn("Show item missing season:", validated);
          return null;
        }
        return {
          ...validated,
          itemtype: "Show",
          season: validated.season,
          author: null,
          director: null,
        } as ShowItem;

      default:
        console.warn("Unknown item type:", validated.itemtype);
        return null;
    }
  } catch (error) {
    console.warn("Invalid database item structure:", error);
    return null;
  }
}

/**
 * Form data extraction helper
 */
export function extractFormData<T>(
  formData: FormData,
  schema: z.ZodSchema<T>,
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const rawData: Record<string, FormDataEntryValue | number | boolean> =
      Object.fromEntries(formData.entries());

    // Convert specific fields to appropriate types
    if ("publishedYear" in rawData) {
      rawData.publishedYear = Number(rawData.publishedYear);
    }
    if ("season" in rawData && rawData.season) {
      rawData.season = Number(rawData.season);
    }
    if ("redo" in rawData) {
      rawData.redo = rawData.redo === "on";
    }

    const result = schema.parse(rawData);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map((err) => err.message),
      };
    }
    return {
      success: false,
      errors: ["Validation failed"],
    };
  }
}
