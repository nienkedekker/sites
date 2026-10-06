import { cacheLife, cacheTag } from "next/cache";
import { supabasePublic } from "@/utils/supabase/public";
import { ITEMS_TAG } from "@/utils/constants/app";
import { validateAndTypeItem, type TypedItem } from "@/types/shared";
import { fetchAllRows } from "@/utils/data/fetch-all";
import { thisYear } from "@/utils/server/clock";

export type DataResult<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: string };

export async function getAllItems(): Promise<TypedItem[]> {
  const rows = await fetchAllRows((from, to) =>
    supabasePublic.from("items").select("*").order("id").range(from, to),
  );
  return rows
    .map(validateAndTypeItem)
    .filter((item): item is TypedItem => item !== null);
}

// Remote, because /recs and the agent routes read it at request time
export async function getCachedItems() {
  "use cache: remote";
  cacheLife("hours");
  cacheTag(ITEMS_TAG);
  return getAllItems();
}

// Failures throw inside the cache so they're never stored
async function fetchItemsForYear(year: number) {
  "use cache";
  cacheLife("hours");
  cacheTag(ITEMS_TAG);
  const { data, error } = await supabasePublic
    .from("items")
    .select("*")
    .eq("belongs_to_year", year)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getItemsForYear(
  year: number,
): Promise<DataResult<TypedItem[]>> {
  let rawItems: unknown[];
  try {
    rawItems = await fetchItemsForYear(year);
  } catch (error) {
    console.error("Database error fetching items for year", year, ":", error);
    return {
      success: false,
      data: null,
      error: `Failed to fetch items: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }

  const validatedItems = rawItems
    .map(validateAndTypeItem)
    .filter((item): item is TypedItem => item !== null);

  const invalidCount = rawItems.length - validatedItems.length;
  if (invalidCount > 0) {
    console.warn(`${invalidCount} invalid items filtered out for year ${year}`);
  }

  return { success: true, data: validatedItems, error: null };
}

export async function getDistinctYears() {
  "use cache";
  cacheLife("hours");
  cacheTag(ITEMS_TAG);
  const { data, error } = await supabasePublic
    .from("distinct_years")
    .select("belongs_to_year")
    .order("belongs_to_year", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.belongs_to_year as number);
}

// Cache Components won't build a route whose generateStaticParams comes back
// empty, so a brand-new log still lists the current year, which has a page
export async function yearParams() {
  const years = new Set([...(await getDistinctYears()), await thisYear()]);
  return [...years].map((year) => ({ year: String(year) }));
}

export const parseYear = (param: string) =>
  /^\d{4}$/.test(param) ? Number(param) : null;

// The current year has a page even before its first entry
export async function isLoggedYear(year: number) {
  return (
    year === (await thisYear()) || (await getDistinctYears()).includes(year)
  );
}

async function fetchRecentItems(limit: number) {
  "use cache";
  cacheLife("hours");
  cacheTag(ITEMS_TAG);
  const { data, error } = await supabasePublic
    .from("items")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getRecentItems(
  limit: number,
): Promise<DataResult<TypedItem[]>> {
  let rawItems: unknown[];
  try {
    rawItems = await fetchRecentItems(limit);
  } catch (error) {
    console.error("Database error fetching recent items:", error);
    return {
      success: false,
      data: null,
      error: `Failed to fetch items: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }

  return {
    success: true,
    data: rawItems
      .map(validateAndTypeItem)
      .filter((item): item is TypedItem => item !== null),
    error: null,
  };
}
