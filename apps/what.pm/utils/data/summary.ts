import { type MonthCounts, type YearSummary } from "@nienke/ui/summary";
import { yearUrl } from "@/utils/constants/site";
import type { TypedItem } from "@/types/shared";
import { localDate } from "@/utils/formatters/date";

function loggedOn(item: TypedItem) {
  if (!item.created_at) return null;
  const date = new Date(item.created_at);
  return Number.isNaN(date.getTime()) ? null : localDate(date);
}

export function monthIndex(item: TypedItem, year: number): number | null {
  const logged = loggedOn(item);
  if (!logged) return null;
  return logged.year < year ? 0 : logged.year > year ? 11 : logged.month - 1;
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
    url: yearUrl(year),
  };
}

export function hasMonthlyData(items: TypedItem[], year: number): boolean {
  const dated = items.map(loggedOn).filter((logged) => logged !== null);
  if (dated.length === 0) return false;
  const loggedInYear = dated.filter((logged) => logged.year === year).length;
  return loggedInYear / dated.length >= 0.5;
}
