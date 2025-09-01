/**
 * Type-safe data fetching utilities for items
 * Ensures consistent validation and error handling across the app
 */

import { supabasePublic } from "@/utils/supabase/public";
import { validateAndTypeItem, type TypedItem } from "@/types/shared";

/**
 * Result type for data operations
 */
export type DataResult<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: string };

/**
 * Fetch and validate items for a specific year
 */
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

    // Validate and type all items
    const validatedItems: TypedItem[] = (rawItems || [])
      .map(validateAndTypeItem)
      .filter((item): item is TypedItem => item !== null);

    // Log if any items failed validation
    if (rawItems && validatedItems.length !== rawItems.length) {
      console.warn(
        `${rawItems.length - validatedItems.length} invalid items filtered out for year ${year}`,
        {
          totalItems: rawItems.length,
          validItems: validatedItems.length,
          invalidItems: rawItems.filter((item) => !validateAndTypeItem(item)),
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
