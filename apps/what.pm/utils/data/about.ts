import { cacheLife, cacheTag } from "next/cache";
import { supabasePublic } from "@/utils/supabase/public";
import { ITEMS_TAG } from "@/utils/constants/app";

export interface LogFacts {
  total: number;
  books: number;
  movies: number;
  shows: number;
  firstYear: number;
  yearCount: number;
  firstEntry: { title: string; itemtype: string; by: string | null } | null;
}

const countOf = async (itemtype?: string) => {
  let query = supabasePublic
    .from("items")
    .select("*", { count: "exact", head: true });
  if (itemtype) query = query.eq("itemtype", itemtype);
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
};

export async function getLogFacts(): Promise<LogFacts> {
  "use cache";
  cacheLife("hours");
  cacheTag(ITEMS_TAG);
  const [total, books, movies, shows, years, first] = await Promise.all([
    countOf(),
    countOf("Book"),
    countOf("Movie"),
    countOf("Show"),
    supabasePublic
      .from("distinct_years")
      .select("belongs_to_year")
      .order("belongs_to_year", { ascending: true }),
    supabasePublic
      .from("items")
      .select("title, itemtype, author, director")
      .order("belongs_to_year", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (years.error) throw new Error(years.error.message);
  if (first.error) throw new Error(first.error.message);

  const loggedYears = (years.data ?? []).map((r) => r.belongs_to_year);

  return {
    total,
    books,
    movies,
    shows,
    firstYear: loggedYears[0],
    yearCount: loggedYears.length,
    firstEntry: first.data
      ? {
          title: first.data.title,
          itemtype: first.data.itemtype,
          by: first.data.author || first.data.director || null,
        }
      : null,
  };
}
