import { supabasePublic } from "@/utils/supabase/public";
import { validateAndTypeItem, type TypedItem } from "@/types/shared";

export type DataResult<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: string };

export async function getItemsForYear(
  year: number,
): Promise<DataResult<TypedItem[]>> {
  try {
    const { data: rawItems, error } = await supabasePublic
      .from("items")
      .select("*")
      .eq("belongs_to_year", year)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Database error fetching items for year", year, ":", error);
      return {
        success: false,
        data: null,
        error: `Failed to fetch items: ${error.message}`,
      };
    }

    const validationResults = (rawItems || []).map((item) => ({
      original: item,
      validated: validateAndTypeItem(item),
    }));

    const validatedItems = validationResults
      .map((r) => r.validated)
      .filter((item): item is TypedItem => item !== null);

    const invalidCount = validationResults.length - validatedItems.length;
    if (invalidCount > 0) {
      const invalidItems = validationResults
        .filter((r) => r.validated === null)
        .map((r) => r.original);

      console.warn(
        `${invalidCount} invalid items filtered out for year ${year}`,
        {
          totalItems: validationResults.length,
          validItems: validatedItems.length,
          invalidItems,
        },
      );
    }

    return {
      success: true,
      data: validatedItems,
      error: null,
    };
  } catch (unexpectedError) {
    console.error(
      "Unexpected error fetching items for year",
      year,
      ":",
      unexpectedError,
    );
    return {
      success: false,
      data: null,
      error:
        unexpectedError instanceof Error
          ? unexpectedError.message
          : "Unknown error occurred",
    };
  }
}

export async function getRecentItems(
  limit: number,
): Promise<DataResult<TypedItem[]>> {
  const { data: rawItems, error } = await supabasePublic
    .from("items")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Database error fetching recent items:", error);
    return {
      success: false,
      data: null,
      error: `Failed to fetch items: ${error.message}`,
    };
  }

  return {
    success: true,
    data: (rawItems ?? [])
      .map(validateAndTypeItem)
      .filter((item): item is TypedItem => item !== null),
    error: null,
  };
}
