import { cacheLife, cacheTag } from "next/cache";
import type { TypedItem } from "@/types/shared";
import { hasMonthlyData, monthIndex } from "@/utils/data/summary";
import { splitNames } from "@/utils/data/search-context";
import { ITEMS_TAG } from "@/utils/constants/app";
import { HIDDEN_PEOPLE } from "@/utils/constants/site";
import { getAllItems } from "@/utils/data/items";
import {
  GENRE_TAGS,
  NO_SUBGENRE,
  genresOf,
  mainSubgenre,
} from "@/utils/data/genres";
import {
  findAdaptations,
  paceYears,
  rereadRhythms,
  type Adaptation,
  type PaceYear,
  type Rhythm,
} from "@/utils/data/patterns";

type ItemType = TypedItem["itemtype"];

export interface YearEntries {
  year: number;
  entries: { id: string; title: string; type: ItemType }[];
}

export interface Person {
  name: string;
  count: number;
  type: ItemType;
}

export interface Genre {
  name: string;
  count: number;
  // Each item's main subgenre, so these add up to the genre's count
  parts?: Genre[];
  // Tags that cut across the subgenres, like Japanese or Queer Fiction
  tags?: Genre[];
}

export interface MonthCell {
  books: number;
  movies: number;
  shows: number;
  titles: { title: string; type: ItemType }[];
}

export interface MonthRow {
  year: number;
  months: MonthCell[];
}

export interface StatsData {
  years: YearEntries[];
  authors: Person[];
  directors: Person[];
  genres: { books: Genre[]; screen: Genre[] };
  monthRows: MonthRow[];
  mostReread: Revisit[];
  pace: PaceYear[];
  rhythms: Rhythm[];
  adaptations: Adaptation[];
}

export interface Revisit {
  title: string;
  type: ItemType;
  times: number;
}

const PEOPLE_COUNT = 10;
const GENRE_COUNT = 10;
const REVISIT_COUNT = 5;
const RHYTHM_COUNT = 6;
// TMDB's TV genres lump these together, so movies are counted the same way
const TYPE_ORDER: Record<ItemType, number> = { Book: 0, Movie: 1, Show: 2 };

const byLogDate = (a: TypedItem, b: TypedItem) =>
  (a.created_at ?? "").localeCompare(b.created_at ?? "");

export function computeStats(items: TypedItem[]): StatsData {
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

  const mostLogged = (type: "Book" | "Movie"): Person[] => {
    const counts = new Map<string, number>();
    for (const item of items) {
      if (item.itemtype !== type) continue;
      const names = splitNames(type === "Book" ? item.author : item.director);
      for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts]
      .filter(([name]) => !HIDDEN_PEOPLE.has(name))
      .map(([name, count]) => ({ name, count, type }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, PEOPLE_COUNT);
  };

  const ranked = (counts: Map<string, number>) =>
    [...counts]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const tally = (
    groups: Map<string, Map<string, number>>,
    genre: string,
    name: string,
  ) => {
    const counts = groups.get(genre) ?? new Map<string, number>();
    counts.set(name, (counts.get(name) ?? 0) + 1);
    groups.set(genre, counts);
  };
  const topGenres = (books: boolean): Genre[] => {
    const counts = new Map<string, number>();
    const parts = new Map<string, Map<string, number>>();
    const tags = new Map<string, Map<string, number>>();
    for (const item of items) {
      if ((item.itemtype === "Book") !== books) continue;
      const main = mainSubgenre(item);
      for (const name of genresOf(item)) {
        counts.set(name, (counts.get(name) ?? 0) + 1);
        tally(parts, name, main);
        for (const tag of item.subgenres.filter((t) => GENRE_TAGS.has(t))) {
          tally(tags, name, tag);
        }
      }
    }
    return ranked(counts)
      .slice(0, GENRE_COUNT)
      .map((genre) => {
        const sub = parts.get(genre.name);
        if (!sub || (sub.size === 1 && sub.has(NO_SUBGENRE))) return genre;
        const tagged = tags.get(genre.name);
        return {
          ...genre,
          // Books without a subgenre go last, whatever their count
          parts: ranked(sub).sort(
            (a, b) =>
              Number(a.name === NO_SUBGENRE) - Number(b.name === NO_SUBGENRE),
          ),
          ...(tagged && { tags: ranked(tagged) }),
        };
      });
  };
  const genres = { books: topGenres(true), screen: topGenres(false) };

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
        b.times - a.times || b.redo - a.redo || a.title.localeCompare(b.title),
    )
    .slice(0, REVISIT_COUNT)
    .map(({ title, type, times }) => ({ title, type, times }));

  const monthlyYears = monthRows.map(({ year }) => year);

  return {
    years,
    authors: mostLogged("Book"),
    directors: mostLogged("Movie"),
    genres,
    monthRows,
    mostReread,
    pace: paceYears(byYear, monthlyYears),
    rhythms: rereadRhythms(
      items,
      new Date().getFullYear(),
      HIDDEN_PEOPLE,
    ).slice(0, RHYTHM_COUNT),
    adaptations: findAdaptations(items),
  };
}

export async function getStatsData(): Promise<StatsData> {
  "use cache";
  cacheLife("hours");
  cacheTag(ITEMS_TAG);
  return computeStats(await getAllItems());
}
