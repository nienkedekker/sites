import { unstable_cache } from "next/cache";
import { supabasePublic } from "@/utils/supabase/public";
import { validateAndTypeItem, type TypedItem } from "@/types/shared";
import { hasMonthlyData, monthIndex } from "@/utils/data/summary";
import { splitNames } from "@/utils/data/search-context";
import { HIDDEN_PEOPLE } from "@/utils/constants/app";

type ItemType = TypedItem["itemtype"];

export interface YearEntries {
  year: number;
  /** Books, then movies, then TV seasons, each in the order logged */
  entries: { id: string; title: string; type: ItemType }[];
}

export interface Person {
  name: string;
  count: number;
  /** What they're mostly logged for, for the bar colour */
  type: ItemType;
}

export interface MonthCell {
  books: number;
  movies: number;
  shows: number;
  /** What was logged, in order, for the tooltip */
  titles: { title: string; type: ItemType }[];
}

export interface MonthRow {
  year: number;
  /** One cell per month, January first */
  months: MonthCell[];
}

export interface StatsData {
  /** Every year from the first to the last, empty years included */
  years: YearEntries[];
  people: Person[];
  /** Only years with real log dates (2019 on), oldest first */
  monthRows: MonthRow[];
  /** The titles gone back to most, with how many times each was logged */
  mostReread: Revisit[];
}

export interface Revisit {
  title: string;
  type: ItemType;
  /** Times read or watched; for shows, of the season seen most often */
  times: number;
}

const PAGE_SIZE = 1000;
const PEOPLE_COUNT = 10;
const REVISIT_COUNT = 5;
const TYPE_ORDER: Record<ItemType, number> = { Book: 0, Movie: 1, Show: 2 };

async function getAllItems(): Promise<TypedItem[]> {
  // Supabase returns at most 1000 rows per request, so page through
  const rows: unknown[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabasePublic
      .from("items")
      .select("*")
      .order("id")
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  return rows
    .map(validateAndTypeItem)
    .filter((item): item is TypedItem => item !== null);
}

const byLogDate = (a: TypedItem, b: TypedItem) =>
  (a.created_at ?? "").localeCompare(b.created_at ?? "");

/** Everything the stats page draws, from one pass over the whole log */
export const getStatsData = unstable_cache(
  async (): Promise<StatsData> => {
    const items = await getAllItems();

    const byYear = new Map<number, TypedItem[]>();
    for (const item of items) {
      const list = byYear.get(item.belongs_to_year) ?? [];
      list.push(item);
      byYear.set(item.belongs_to_year, list);
    }

    const loggedYears = [...byYear.keys()];
    const first = Math.min(...loggedYears);
    const last = Math.max(...loggedYears);
    const allYears = loggedYears.length
      ? Array.from({ length: last - first + 1 }, (_, i) => first + i)
      : [];

    const years = allYears.map((year) => ({
      year,
      entries: [...(byYear.get(year) ?? [])]
        .sort(
          (a, b) =>
            TYPE_ORDER[a.itemtype] - TYPE_ORDER[b.itemtype] || byLogDate(a, b),
        )
        .map(({ id, title, itemtype }) => ({ id, title, type: itemtype })),
    }));

    // Authors and directors, counting co-authors separately
    const people = new Map<string, Record<ItemType, number>>();
    for (const item of items) {
      const names =
        item.itemtype === "Book"
          ? splitNames(item.author)
          : item.itemtype === "Movie"
            ? splitNames(item.director)
            : [];
      for (const name of names) {
        const counts = people.get(name) ?? { Book: 0, Movie: 0, Show: 0 };
        counts[item.itemtype] += 1;
        people.set(name, counts);
      }
    }

    const topPeople = [...people]
      .filter(([name]) => !HIDDEN_PEOPLE.has(name))
      .map(([name, counts]) => {
        const count = counts.Book + counts.Movie + counts.Show;
        const type = (Object.keys(counts) as ItemType[]).reduce((a, b) =>
          counts[b] > counts[a] ? b : a,
        );
        return { name, count, type };
      })
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, PEOPLE_COUNT);

    const monthRows = allYears
      .filter((year) => hasMonthlyData(byYear.get(year) ?? [], year))
      .map((year) => {
        const months: MonthCell[] = Array.from({ length: 12 }, () => ({
          books: 0,
          movies: 0,
          shows: 0,
          titles: [],
        }));
        for (const item of [...(byYear.get(year) ?? [])].sort(byLogDate)) {
          const index = monthIndex(item, year);
          if (index === null) continue;
          const key = {
            Book: "books",
            Movie: "movies",
            Show: "shows",
          } as const;
          months[index][key[item.itemtype]] += 1;
          months[index].titles.push({ title: item.title, type: item.itemtype });
        }
        return { year, months };
      });

    // Titles with at least one reread or rewatch. Shows are logged per
    // season, so count the season seen most often rather than all entries
    const titles = new Map<
      string,
      { title: string; type: ItemType; redo: number; seen: Map<string, number> }
    >();
    for (const item of items) {
      const makers = [
        ...splitNames(item.itemtype === "Book" ? item.author : null),
        ...splitNames(item.itemtype === "Movie" ? item.director : null),
      ];
      if (makers.some((name) => HIDDEN_PEOPLE.has(name))) continue;
      const key = `${item.itemtype}|${item.title.trim().toLowerCase()}`;
      const group = titles.get(key) ?? {
        title: item.title,
        type: item.itemtype,
        redo: 0,
        seen: new Map<string, number>(),
      };
      if (item.redo) group.redo += 1;
      const season = item.itemtype === "Show" ? String(item.season ?? "") : "";
      group.seen.set(season, (group.seen.get(season) ?? 0) + 1);
      titles.set(key, group);
    }

    const mostReread = [...titles.values()]
      .filter((group) => group.redo > 0)
      .map(({ title, type, redo, seen }) => ({
        title,
        type,
        redo,
        times: Math.max(...seen.values()),
      }))
      .sort(
        (a, b) =>
          b.times - a.times ||
          b.redo - a.redo ||
          a.title.localeCompare(b.title),
      )
      .slice(0, REVISIT_COUNT)
      .map(({ title, type, times }) => ({ title, type, times }));

    return { years, people: topPeople, monthRows, mostReread };
  },
  ["stats-data"],
  { revalidate: 3600 },
);
