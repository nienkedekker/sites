import type { MonthCounts, YearSummary } from "@nienke/ui/summary";
import type { TypedItem } from "@/types/shared";

/**
 * Counts per type for each month of the year, by the date an item was logged.
 * Items logged just after the year ended (say, a December book logged on
 * January 2nd) count towards December; items with no log date are left out.
 */
export function countByMonth(items: TypedItem[], year: number): MonthCounts[] {
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    books: 0,
    movies: 0,
    shows: 0,
  }));

  for (const item of items) {
    if (!item.created_at) continue;
    const loggedYear = Number(item.created_at.slice(0, 4));
    const loggedMonth = Number(item.created_at.slice(5, 7));
    const index =
      loggedYear < year ? 0 : loggedYear > year ? 11 : loggedMonth - 1;
    const key =
      item.itemtype === "Book"
        ? "books"
        : item.itemtype === "Movie"
          ? "movies"
          : "shows";
    months[index][key] += 1;
  }

  return months;
}

/**
 * The year's counts per type and per month, as the summary API returns them
 * and the shared month-by-month chart reads them.
 */
export function summarizeYear(items: TypedItem[], year: number): YearSummary {
  const count = (type: TypedItem["itemtype"]) =>
    items.filter((item) => item.itemtype === type).length;

  return {
    year,
    counts: {
      books: count("Book"),
      movies: count("Movie"),
      shows: count("Show"),
    },
    months: countByMonth(items, year),
    url: `https://what.pm/year/${year}`,
  };
}

/**
 * Whether a year's month-by-month counts mean anything. Older years were
 * back-filled long after they ended, so all their log dates are later and
 * countByMonth puts every item in December. If fewer than half of the items
 * were logged during the year itself, treat the months as unknown.
 */
export function hasMonthlyData(items: TypedItem[], year: number): boolean {
  const dated = items.filter((item) => item.created_at);
  if (dated.length === 0) return false;
  const loggedInYear = dated.filter(
    (item) => Number(item.created_at!.slice(0, 4)) === year,
  ).length;
  return loggedInYear / dated.length >= 0.5;
}
