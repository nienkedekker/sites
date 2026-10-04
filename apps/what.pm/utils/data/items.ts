import { unstable_cache } from "next/cache";
import { supabasePublic } from "@/utils/supabase/public";
import { ITEMS_TAG } from "@/utils/constants/app";
import { validateAndTypeItem, type TypedItem } from "@/types/shared";
import { fetchAllRows } from "@/utils/data/fetch-all";
import { getCurrentYear } from "@/utils/formatters/date";

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

export const getCachedItems = unstable_cache(getAllItems, ["all-items"], {
  revalidate: 3600,
  tags: [ITEMS_TAG],
});

// Failures throw inside the cache so they're never stored
const fetchItemsForYear = unstable_cache(
  async (year: number) => {
    const { data, error } = await supabasePublic
      .from("items")
      .select("*")
      .eq("belongs_to_year", year)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["items-for-year"],
  { revalidate: 3600, tags: [ITEMS_TAG] },
);

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

export const getDistinctYears = unstable_cache(
  async () => {
    const { data, error } = await supabasePublic
      .from("distinct_years")
      .select("belongs_to_year")
      .order("belongs_to_year", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => r.belongs_to_year as number);
  },
  ["distinct-years"],
  { revalidate: 3600, tags: [ITEMS_TAG] },
);

export const parseYear = (param: string) =>
  /^\d{4}$/.test(param) ? Number(param) : null;

// The current year has a page even before its first entry
export async function isLoggedYear(year: number) {
  return year === getCurrentYear() || (await getDistinctYears()).includes(year);
}

const fetchRecentItems = unstable_cache(
  async (limit: number) => {
    const { data, error } = await supabasePublic
      .from("items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["recent-items"],
  { revalidate: 3600, tags: [ITEMS_TAG] },
);

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
