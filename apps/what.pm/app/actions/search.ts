"use server";

import { createClientForServer } from "@/utils/supabase/server";
import { fetchAllRows } from "@/utils/data/fetch-all";
import { ilikeAny } from "@/utils/data/search-filter";
import { searchQuerySchema } from "@/utils/schemas/validation";
import { Item } from "@/types";

export type SearchState = {
  query: string;
  results: Item[];
  initial: boolean;
};

export async function searchItems(formData: FormData): Promise<SearchState> {
  const rawQuery = formData.get("query")?.toString() ?? "";

  if (!rawQuery) return { query: "", results: [], initial: false };

  const queryValidation = searchQuerySchema.safeParse(rawQuery);
  if (!queryValidation.success) {
    return { query: rawQuery, results: [], initial: false };
  }

  const trimmedQuery = queryValidation.data;

  const supabase = await createClientForServer();

  const filter = ilikeAny(["title", "author", "director"], trimmedQuery);

  try {
    const results = await fetchAllRows((from, to) =>
      supabase
        .from("items")
        .select(
          "id, title, author, director, itemtype, season, published_year, belongs_to_year, redo, in_progress, external_id, pages, runtime_minutes",
        )
        .or(filter)
        .order("created_at", { ascending: false })
        .order("id")
        .range(from, to),
    );
    return { query: rawQuery, results: results as Item[], initial: false };
  } catch (error) {
    console.error("Search error:", error);
    return { query: rawQuery, results: [], initial: false };
  }
}
