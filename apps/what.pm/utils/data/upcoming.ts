import { genresIn } from "@/utils/data/book-genres";
import { normalizeTitle } from "@/utils/data/patterns";


export interface Cover {
  url: string;
  width: number;
  height: number;
}

export interface Run {
  text: string;
  italic?: boolean;
  bold?: boolean;
}

export interface UpcomingBook {
  id: number;
  slug: string | null;
  title: string;
  authors: string[];
  releaseDate: string;
  readers: number;
  genres: string[];
  cover: Cover | null;
  description: Run[] | null;
}

export interface HardcoverBook {
  id: number;
  slug?: string | null;
  title?: string | null;
  release_date?: string | null;
  users_count?: number | null;
  description?: string | null;
  cached_image?: { url?: string; width?: number; height?: number } | null;
  cached_contributors?:
    | { author?: { name?: string } | null; contribution?: string | null }[]
    | null;
  cached_tags?: { Genre?: { tag?: string }[] } | null;
}

const DESCRIPTION_LENGTH = 2000;

const LEFT_OUT = /\b(romance|romantasy|young adult|ya)\b/i;

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
};

const decode = (text: string) =>
  text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, name: string) => {
    if (name[0] === "#") {
      const code =
        name[1].toLowerCase() === "x"
          ? parseInt(name.slice(2), 16)
          : Number(name.slice(1));
      return Number.isFinite(code) ? String.fromCodePoint(code) : entity;
    }
    return ENTITIES[name.toLowerCase()] ?? entity;
  });

export function descriptionRuns(html: string): Run[] {
  const flat = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<\/?p[^>]*>/gi, "");
  const runs: Run[] = [];
  let italic = 0;
  let bold = 0;
  const push = (raw: string) => {
    const text = decode(raw.replace(/<[^>]*>/g, ""));
    if (!text) return;
    runs.push({
      text,
      ...(italic > 0 ? { italic: true } : {}),
      ...(bold > 0 ? { bold: true } : {}),
    });
  };
  let last = 0;
  for (const match of flat.matchAll(/<(\/?)(i|em|b|strong)\b[^>]*>/gi)) {
    push(flat.slice(last, match.index));
    last = match.index + match[0].length;
    const step = match[1] ? -1 : 1;
    if (/^(i|em)$/i.test(match[2])) italic = Math.max(0, italic + step);
    else bold = Math.max(0, bold + step);
  }
  push(flat.slice(last));
  const tidy = runs.map((run) => ({
    ...run,
    text: run.text.replace(/[ \t]*\n[ \t]*/g, "\n").replace(/\n{3,}/g, "\n\n"),
  }));
  if (tidy.length) {
    tidy[0].text = tidy[0].text.trimStart();
    tidy[tidy.length - 1].text = tidy[tidy.length - 1].text.trimEnd();
  }
  return tidy.filter((run) => run.text);
}

function shorten(runs: Run[]): Run[] {
  const kept: Run[] = [];
  let length = 0;
  for (const run of runs) {
    if (length + run.text.length <= DESCRIPTION_LENGTH) {
      kept.push(run);
      length += run.text.length;
      continue;
    }
    const room = DESCRIPTION_LENGTH - length;
    const text = run.text.slice(0, room).replace(/\s+\S*$/, "");
    kept.push({ ...run, text: `${text}…` });
    break;
  }
  return kept;
}

function authorsOf(book: HardcoverBook) {
  const people = book.cached_contributors ?? [];
  const writers = people.filter(
    ({ contribution }) => !contribution || contribution === "Author",
  );
  return (writers.length ? writers : people)
    .map(({ author }) => author?.name?.trim())
    .filter((name): name is string => Boolean(name));
}

function coverOf(book: HardcoverBook): Cover | null {
  const { url, width, height } = book.cached_image ?? {};
  return url && width && height ? { url, width, height } : null;
}

export function toUpcoming(books: HardcoverBook[]): UpcomingBook[] {
  return books.flatMap((book) => {
    const title = book.title?.trim();
    if (!title || !book.release_date) return [];
    const tags = (book.cached_tags?.Genre ?? [])
      .map(({ tag }) => tag)
      .filter((tag): tag is string => Boolean(tag));
    if (tags.some((tag) => LEFT_OUT.test(tag))) return [];
    const description = book.description
      ? descriptionRuns(book.description)
      : [];
    return [
      {
        id: book.id,
        slug: book.slug ?? null,
        title,
        authors: authorsOf(book),
        releaseDate: book.release_date,
        readers: book.users_count ?? 0,
        genres: genresIn(tags),
        cover: coverOf(book),
        description: description.length ? shorten(description) : null,
      },
    ];
  });
}

export const isOut = (book: UpcomingBook, today: string) =>
  book.releaseDate <= today;

export function byMonth(books: UpcomingBook[], newestFirst = false) {
  const months = new Map<string, UpcomingBook[]>();
  const direction = newestFirst ? -1 : 1;
  const sorted = [...books].sort(
    (a, b) =>
      direction * a.releaseDate.localeCompare(b.releaseDate) ||
      b.readers - a.readers,
  );
  for (const book of sorted) {
    const month = book.releaseDate.slice(0, 7);
    months.set(month, [...(months.get(month) ?? []), book]);
  }
  return [...months].map(([month, books]) => ({ month, books }));
}

export function favouriteGenres(genreLists: string[][], count = 4) {
  const tally = new Map<string, number>();
  for (const genre of genreLists.flat()) {
    tally.set(genre, (tally.get(genre) ?? 0) + 1);
  }
  return [...tally]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, count)
    .map(([genre]) => genre);
}

export function genresOf(books: UpcomingBook[]) {
  return favouriteGenres(
    books.map((book) => book.genres),
    Infinity,
  );
}

export const matchesGenres = (book: UpcomingBook, genres: Set<string>) =>
  genres.size === 0 || book.genres.some((genre) => genres.has(genre));

export const titleKey = (title: string) =>
  normalizeTitle(title.split(/[:(]/)[0]);
