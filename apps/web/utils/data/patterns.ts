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

export interface Adaptation {
  book: { title: string; author: string; year: number };
  screen: { title: string; type: "Movie" | "Show"; year: number };
}

export const normalizeTitle = (title: string) =>
  title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/^(the|a|an) /, "")
    .replace(/\s+/g, " ")
    .trim();

// "Dune: Part Two" counts as an adaptation of "Dune", but "Dune Messiah"
// doesn't match "Dune: Part Two"
function titlesMatch(book: string, screen: string) {
  const a = normalizeTitle(book);
  const b = normalizeTitle(screen);
  return a.length > 2 && (a === b || b.startsWith(`${a} `));
}

export function findAdaptations(items: TypedItem[]): Adaptation[] {
  const books = items.filter((item) => item.itemtype === "Book");
  const screens = items.filter(
    (item) => item.itemtype !== "Book" && item.based_on,
  );
  const pairs = new Map<string, Adaptation>();

  for (const screen of screens) {
    const sources = new Set(splitNames(screen.based_on).map(normalizeTitle));
    for (const book of books) {
      if (!titlesMatch(book.title, screen.title)) continue;
      // Pen names (James S.A. Corey) won't match the credited writers, so an
      // identical title is enough on its own
      const sameAuthor = splitNames(book.author).some((name) =>
        sources.has(normalizeTitle(name)),
      );
      const sameTitle =
        normalizeTitle(book.title) === normalizeTitle(screen.title);
      if (!sameAuthor && !sameTitle) continue;

      const key = `${normalizeTitle(book.title)}|${normalizeTitle(screen.title)}`;
      const existing = pairs.get(key);
      pairs.set(key, {
        book: {
          title: book.title,
          author: book.author ?? "",
          year: Math.min(
            existing?.book.year ?? Infinity,
            book.belongs_to_year,
          ),
        },
        screen: {
          title: screen.title,
          type: screen.itemtype as "Movie" | "Show",
          year: Math.min(
            existing?.screen.year ?? Infinity,
            screen.belongs_to_year,
          ),
        },
      });
    }
  }

  return [...pairs.values()].sort(
    (a, b) =>
      Math.max(b.book.year, b.screen.year) -
        Math.max(a.book.year, a.screen.year) ||
      a.book.title.localeCompare(b.book.title),
  );
}

export interface TimeSpent {
  pages: number;
  booksWithPages: number;
  books: number;
  minutes: number;
  screensWithRuntime: number;
  screens: number;
}

export function timeSpent(items: TypedItem[]): TimeSpent {
  const books = items.filter((item) => item.itemtype === "Book");
  const screens = items.filter((item) => item.itemtype !== "Book");
  const paged = books.filter((item) => item.pages);
  const timed = screens.filter((item) => item.runtime_minutes);
  return {
    pages: paged.reduce((sum, item) => sum + (item.pages ?? 0), 0),
    booksWithPages: paged.length,
    books: books.length,
    minutes: timed.reduce((sum, item) => sum + (item.runtime_minutes ?? 0), 0),
    screensWithRuntime: timed.length,
    screens: screens.length,
  };
}
