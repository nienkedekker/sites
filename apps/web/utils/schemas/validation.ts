import { z } from "zod";
import { VALID_ITEM_TYPES } from "@/types/shared";
import { ITEM_TYPES } from "@/utils/constants/app";
import { getCurrentYear } from "@/utils/formatters/date";

/**
 * Year validation schema
 */
const yearSchema = z
  .number()
  .int()
  .min(1600, "Year must be 1600 or later")
  .max(
    getCurrentYear() + 10,
    `Year must be ${getCurrentYear() + 10} or earlier`,
  );

/**
 * Base item schema with common fields
 */
const baseItemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  itemtype: z.enum(VALID_ITEM_TYPES, {
    message: "Invalid item type",
  }),
  belongsToYear: yearSchema,
  publishedYear: yearSchema,
  redo: z.boolean(),
});

/**
 * Book-specific schema
 */
export const bookItemSchema = baseItemSchema.extend({
  itemtype: z.literal(ITEM_TYPES.BOOK),
  author: z
    .string()
    .trim()
    .min(1, "Author is required for books")
    .max(100, "Author must be 100 characters or less"),
  director: z.string().optional(),
  season: z.number().optional(),
});

/**
 * Movie-specific schema
 */
export const movieItemSchema = baseItemSchema.extend({
  itemtype: z.literal(ITEM_TYPES.MOVIE),
  director: z
    .string({ message: "Director is required for movies" })
    .trim()
    .min(1, "Director is required for movies")
    .max(100, "Director must be 100 characters or less"),
  author: z.string().optional(),
  season: z.number().optional(),
});

/**
 * Show-specific schema
 */
export const showItemSchema = baseItemSchema.extend({
  itemtype: z.literal(ITEM_TYPES.SHOW),
  season: z
    .number({ message: "Season is required for shows" })
    .int()
    .min(1, "Season must be at least 1")
    .max(50, "Season must be 50 or less"),
  author: z.string().optional(),
  director: z.string().optional(),
  inProgress: z.boolean().optional(),
});

/**
 * Discriminated union for item creation
 */
export const itemCreationSchema = z.discriminatedUnion("itemtype", [
  bookItemSchema,
  movieItemSchema,
  showItemSchema,
]);

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Please enter a valid email address");

/**
 * Password validation schema
 */
export const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must be 128 characters or less");

/**
 * Search query validation schema
 */
export const searchQuerySchema = z
  .string()
  .trim()
  .min(1, "Search query is required")
  .min(2, "Search query must be at least 2 characters long")
  .max(100, "Search query must be 100 characters or less");

/**
 * Form data schemas for server actions
 */
export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const searchSchema = z.object({
  query: searchQuerySchema,
  itemType: z.string().optional(),
  sortBy: z.enum(["title", "published_year", "created_at"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

/**
 * Type exports for use in components
 */
export type BookItemInput = z.infer<typeof bookItemSchema>;
export type MovieItemInput = z.infer<typeof movieItemSchema>;
export type ShowItemInput = z.infer<typeof showItemSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

export function extractFormData<T>(
  formData: FormData,
  schema: z.ZodSchema<T>,
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const rawData: Record<string, FormDataEntryValue | number | boolean> =
      Object.fromEntries(formData.entries());

    if ("publishedYear" in rawData) {
      rawData.publishedYear = Number(rawData.publishedYear);
    }
    if ("belongsToYear" in rawData) {
      rawData.belongsToYear = Number(rawData.belongsToYear);
    }
    if ("season" in rawData && rawData.season) {
      rawData.season = Number(rawData.season);
    }
    if ("redo" in rawData) {
      rawData.redo = rawData.redo === "on";
    }
    if ("inProgress" in rawData) {
      rawData.inProgress = rawData.inProgress === "on";
    }

    const result = schema.parse(rawData);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.issues.map((e) => e.message) };
    }
    return { success: false, errors: ["Validation failed"] };
  }
}
