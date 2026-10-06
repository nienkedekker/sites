import { cacheLife, cacheTag } from "next/cache";
import { supabasePublic } from "@/utils/supabase/public";
import { ITEMS_TAG } from "@/utils/constants/app";
import { HIDDEN_PEOPLE } from "@/utils/constants/site";
import { splitNames } from "@/utils/data/names";

export interface SearchSuggestion {
  name: string;
  count: number;
}

export interface SearchContext {
  suggestions: SearchSuggestion[];
  years: number[];
}

const PAGE_SIZE = 1000;
const SUGGESTION_COUNT = 8;

export { splitNames };

export async function getSearchContext(): Promise<SearchContext> {
  "use cache";
  cacheLife("hours");
  cacheTag(ITEMS_TAG);
  // Supabase returns at most 1000 rows per request, so page through
  const rows: {
    author: string | null;
    director: string | null;
    belongs_to_year: number;
  }[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabasePublic
      .from("items")
      .select("author, director, belongs_to_year")
      .order("id")
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const name of [
      ...splitNames(row.author),
      ...splitNames(row.director),
    ]) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }

  const suggestions = [...counts]
    .filter(([name]) => !HIDDEN_PEOPLE.has(name))
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, SUGGESTION_COUNT);

  const logged = rows.map((row) => row.belongs_to_year);
  const first = Math.min(...logged);
  const last = Math.max(...logged);
  const years = logged.length
    ? Array.from({ length: last - first + 1 }, (_, i) => first + i)
    : [];

  return { suggestions, years };
}
