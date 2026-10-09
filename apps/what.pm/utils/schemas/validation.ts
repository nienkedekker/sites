import { z } from "zod";
import { VALID_ITEM_TYPES } from "@/types/shared";
import { ITEM_TYPES } from "@/utils/constants/app";
import { getCurrentYear } from "@/utils/formatters/date";
import { isExternalId } from "@/utils/data/external-ids";

const yearSchema = z
  .number()
  .int()
  .min(1600, "Year must be 1600 or later")
  .max(
    getCurrentYear() + 10,
    `Year must be ${getCurrentYear() + 10} or earlier`,
  );

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
  externalId: z.string().trim().max(100).optional(),
});

export const bookItemSchema = baseItemSchema.extend({
  itemtype: z.literal(ITEM_TYPES.BOOK),
  author: z
    .string()
    .trim()
    .min(1, "Author is required for books")
    .max(100, "Author must be 100 characters or less"),
  // 0 is an empty field
  pages: z
    .number()
    .int()
    .min(0, "Pages can't be negative")
    .max(10000, "Pages must be 10,000 or less")
    .optional(),
  director: z.string().optional(),
  season: z.number().optional(),
  inProgress: z.boolean().optional(),
  didNotFinish: z.boolean().optional(),
});

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
  didNotFinish: z.boolean().optional(),
});

export const itemCreationSchema = z.discriminatedUnion("itemtype", [
  bookItemSchema,
  movieItemSchema,
  showItemSchema,
]);

const pickKeyFields = {
  itemtype: z.enum(VALID_ITEM_TYPES, { message: "Invalid item type" }),
  externalId: z.string().trim().min(1).max(100),
};

const hasExternalId = ({
  itemtype,
  externalId,
}: {
  itemtype: (typeof VALID_ITEM_TYPES)[number];
  externalId: string;
}) => isExternalId(itemtype, externalId);
const externalIdIssue = {
  message: "Invalid external id",
  path: ["externalId"],
};

const pickTitle = z.string().trim().min(1).max(200);

// Picks already in the database only need to be found again, so this doesn't
// check the id's shape
export const pickKeySchema = z.object(pickKeyFields);

export const dismissSchema = z
  .object({
    ...pickKeyFields,
    title: pickTitle,
    kind: z.enum(["not_for_me", "seen"]),
  })
  .refine(hasExternalId, externalIdIssue);

export const upNextSchema = z
  .object({
    ...pickKeyFields,
    title: pickTitle,
    creator: z.string().trim().max(200).optional(),
  })
  .refine(hasExternalId, externalIdIssue);

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Please enter a valid email address");

const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must be 128 characters or less");

export const searchQuerySchema = z
  .string()
  .trim()
  .min(1, "Search query is required")
  .min(2, "Search query must be at least 2 characters long")
  .max(100, "Search query must be 100 characters or less");

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const changePasswordSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

export type BookItemInput = z.infer<typeof bookItemSchema>;
export type MovieItemInput = z.infer<typeof movieItemSchema>;
export type ShowItemInput = z.infer<typeof showItemSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

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
    if ("pages" in rawData) {
      rawData.pages = Number(rawData.pages);
    }
    if ("redo" in rawData) {
      rawData.redo = rawData.redo === "on";
    }
    if ("inProgress" in rawData) {
      rawData.inProgress = rawData.inProgress === "on";
    }
    if ("didNotFinish" in rawData) {
      rawData.didNotFinish = rawData.didNotFinish === "on";
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
