import { cacheLife, cacheTag } from "next/cache";
import { supabasePublic } from "@/utils/supabase/public";
import { ITEMS_TAG } from "@/utils/constants/app";
import type { Database } from "@/types";

type CumulativeRow =
  Database["public"]["Functions"]["get_cumulative_item_counts"]["Returns"][number];

// Failures throw inside the cache so they're never stored
export async function fetchCumulativeCounts() {
  "use cache";
  cacheLife("hours");
  cacheTag(ITEMS_TAG);
  const { data, error } = await supabasePublic.rpc(
    "get_cumulative_item_counts",
  );
  if (error) throw new Error(error.message);

  return [...((data ?? []) as CumulativeRow[])]
    .sort((a, b) => a.log_year - b.log_year)
    .map(({ log_year, book_total, movie_total, show_total }) => ({
      year: log_year,
      Book: book_total,
      Movie: movie_total,
      Show: show_total,
    }));
}
