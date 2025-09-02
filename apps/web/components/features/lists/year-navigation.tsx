import Link from "next/link";
import { unstable_cache } from "next/cache";
import { supabasePublic } from "@/utils/supabase/public";

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
    <div className="bg-indigo-50/50 dark:bg-indigo-950/30 text-sm p-3 px-5 text-foreground">
      <ul className="flex gap-4 flex-wrap">
        {years.map((y) => (
          <li key={y}>
            <Link
              href={`/year/${y}`}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              {y}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
