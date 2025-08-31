"use server";

import { createClientForServer } from "@/utils/supabase/server";
import { searchQuerySchema } from "@/utils/schemas/validation";
import { Item } from "@/types";

export type SearchState = {
  query: string;
  results: Item[];
  initial: boolean;
};

export async function searchItems(
  prevState: SearchState,
  formData: FormData,
): Promise<SearchState> {
  const rawQuery = formData.get("query") as string;

  if (!rawQuery) return { query: "", results: [], initial: false };

  // Validate query using Zod schema
  const queryValidation = searchQuerySchema.safeParse(rawQuery);
  if (!queryValidation.success) {
    return { query: rawQuery, results: [], initial: false };
  }

  const trimmedQuery = queryValidation.data;

  const supabase = await createClientForServer();

  // Escape special characters for ILIKE pattern matching
  const escapedQuery = trimmedQuery.replace(/[%_]/g, "\\$&");

  const { data, error } = await supabase
    .from("items")
    .select(
      "id, title, author, director, itemtype, season, published_year, belongs_to_year, redo",
    ) // Select only needed columns
    .or(
      `title.ilike.%${escapedQuery}%,author.ilike.%${escapedQuery}%,director.ilike.%${escapedQuery}%`,
    )
    .order("created_at", { ascending: false })
    .limit(100); // Limit results to prevent excessive data transfer

  if (error) {
    console.error("Search error:", error);
    return { query: rawQuery, results: [], initial: false };
  }

  return {
    query: rawQuery,
    results: data as Item[],
    initial: false,
  };
}
