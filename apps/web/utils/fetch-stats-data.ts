import { createClientForServer } from "@/utils/supabase/server";

/** Running totals per type, year by year, for the line chart */
export async function fetchCumulativeCounts() {
  const supabase = await createClientForServer();
  const { data, error } = await supabase.rpc("get_cumulative_item_counts");

  if (error) {
    console.error("Error fetching cumulative items:", error);
    return null;
  }

  return [...(data ?? [])]
    .sort((a, b) => a.log_year - b.log_year)
    .map(({ log_year, book_total, movie_total, show_total }) => ({
      year: log_year,
      Book: book_total,
      Movie: movie_total,
      Show: show_total,
    }));
}
