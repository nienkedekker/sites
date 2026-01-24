import { unstable_cache } from "next/cache";
import { supabasePublic } from "@/utils/supabase/public";
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
  ["distinct-years"], // cache key
  { revalidate: 3600 }, // 1 hour cache
);

export default async function YearNavigation() {
  let years: number[] = [];
  try {
    years = await getDistinctYears();
  } catch (e) {
    console.error("Error fetching years:", e);
    return <p className="px-5 py-3 text-sm">Failed to load years.</p>;
  }

  if (years.length === 0) {
    return null;
  }

  return (
    <div className="bg-indigo-50/50 dark:bg-indigo-950/30 text-sm py-3 px-4 sm:px-6 text-foreground">
      <YearLinks years={years} />
    </div>
  );
}
