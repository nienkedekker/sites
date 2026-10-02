import type { TypedItem } from "@/types/shared";
import { splitNames } from "@/utils/data/names";

type ItemType = TypedItem["itemtype"];

const DAY = 86_400_000;

export const daysInYear = (year: number) =>
  (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / DAY;

export function dayOfYear(date: Date) {
  const year = date.getUTCFullYear();
  const day = Date.UTC(year, date.getUTCMonth(), date.getUTCDate());
  return Math.floor((day - Date.UTC(year, 0, 1)) / DAY);
}

// Same clamping as monthIndex: logs from before the year count on day one,
// logs from after it on the last day
export function dayIndex(item: TypedItem, year: number): number | null {
  if (!item.created_at) return null;
  const logged = new Date(item.created_at);
  if (Number.isNaN(logged.getTime())) return null;
  const loggedYear = logged.getUTCFullYear();
  if (loggedYear < year) return 0;
  if (loggedYear > year) return daysInYear(year) - 1;
  return dayOfYear(logged);
}

export interface PaceYear {
  year: number;
  days: number[];
}

export function paceYears(byYear: Map<number, TypedItem[]>, years: number[]) {
  return years.map((year) => ({
    year,
    days: (byYear.get(year) ?? [])
      .map((item) => dayIndex(item, year))
      .filter((day): day is number => day !== null)
      .sort((a, b) => a - b),
  }));
}

export interface Rhythm {
  title: string;
  type: ItemType;
  season: number | null;
  years: number[];
  every: number;
  due: boolean;
}

export function rereadRhythms(
  items: TypedItem[],
  currentYear: number,
  hidden: ReadonlySet<string>,
): Rhythm[] {
  const groups = new Map<
    string,
    {
      title: string;
      type: ItemType;
      season: number | null;
      redo: boolean;
      years: Set<number>;
    }
  >();

  for (const item of items) {
    const makers = splitNames(
      item.itemtype === "Book"
        ? item.author
        : item.itemtype === "Movie"
          ? item.director
          : null,
    );
    if (makers.some((name) => hidden.has(name))) continue;
    const season = item.itemtype === "Show" ? item.season : null;
    const key = `${item.itemtype}|${item.title.trim().toLowerCase()}|${season ?? ""}`;
    const group = groups.get(key) ?? {
      title: item.title,
      type: item.itemtype,
      season,
      redo: false,
      years: new Set<number>(),
    };
    group.redo ||= item.redo;
    group.years.add(item.belongs_to_year);
    groups.set(key, group);
  }

  return [...groups.values()]
    .filter((group) => group.redo && group.years.size > 1)
    .map(({ title, type, season, years }) => {
      const sorted = [...years].sort((a, b) => a - b);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const every = (last - first) / (sorted.length - 1);
      const since = currentYear - last;
      return {
        title,
        type,
        season,
        years: sorted,
        every,
        // Past the usual gap, but not so long ago that the habit has lapsed
        due: since >= Math.round(every) && since <= every * 2,
      };
    })
    .sort(
      (a, b) =>
        b.years.length - a.years.length ||
        b.years[b.years.length - 1] - a.years[a.years.length - 1] ||
        a.title.localeCompare(b.title),
    );
}
