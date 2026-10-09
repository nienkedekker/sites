import "server-only";
import { supabasePublic } from "@/utils/supabase/public";
import { fetchAllRows } from "@/utils/data/fetch-all";
import { ilikeAny } from "@/utils/data/search-filter";
import type { Item } from "@/types";

export async function searchItems(query: string): Promise<Item[]> {
  const filter = ilikeAny(["title", "author", "director"], query);

  const results = await fetchAllRows((from, to) =>
    supabasePublic
      .from("items")
      .select(
        "id, title, author, director, itemtype, season, published_year, belongs_to_year, redo, in_progress, did_not_finish, external_id, pages, runtime_minutes",
      )
      .or(filter)
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, to),
  );
  return results as Item[];
}
