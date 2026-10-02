import { unstable_cache } from "next/cache";
import { supabasePublic } from "@/utils/supabase/public";
import { ITEMS_TAG } from "@/utils/constants/app";
import { YearLinks } from "./year-links";

const getDistinctYears = unstable_cache(
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

export default async function YearNavigation() {
  let years: number[] = [];
  try {
    years = await getDistinctYears();
  } catch (e) {
    console.error("Error fetching years:", e);
    return (
      <p className="mx-auto max-w-6xl px-4 py-3 font-mono text-xs text-ink-soft">
        Failed to load years.
      </p>
    );
  }

  if (years.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Browse by year" className="border-b border-rule">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <YearLinks years={years} />
      </div>
    </nav>
  );
}
