import {
  whatpmYearUrl,
  type MonthCounts,
  type YearSummary,
} from "@nienke/ui/summary";
import type { TypedItem } from "@/types/shared";

export function monthIndex(item: TypedItem, year: number): number | null {
  if (!item.created_at) return null;
  const loggedYear = Number(item.created_at.slice(0, 4));
  const loggedMonth = Number(item.created_at.slice(5, 7));
  return loggedYear < year ? 0 : loggedYear > year ? 11 : loggedMonth - 1;
}

export function countByMonth(items: TypedItem[], year: number): MonthCounts[] {
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    books: 0,
    movies: 0,
    shows: 0,
  }));

  for (const item of items) {
    const index = monthIndex(item, year);
    if (index === null) continue;
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
    url: whatpmYearUrl(year),
  };
}

export function hasMonthlyData(items: TypedItem[], year: number): boolean {
  const dated = items.filter((item) => item.created_at);
  if (dated.length === 0) return false;
  const loggedInYear = dated.filter(
    (item) => Number(item.created_at!.slice(0, 4)) === year,
  ).length;
  return loggedInYear / dated.length >= 0.5;
}
