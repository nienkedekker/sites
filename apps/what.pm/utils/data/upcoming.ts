import { genresIn } from "@/utils/data/book-genres";
import { normalizeTitle } from "@/utils/data/patterns";

// New books, out in the last two months or coming soon, as Hardcover
// describes them

export interface Cover {
  url: string;
  width: number;
  height: number;
}

export interface UpcomingBook {
  id: number;
  slug: string | null;
  title: string;
  authors: string[];
  // YYYY-MM-DD
  releaseDate: string;
  // How many Hardcover readers have it on a shelf: how anticipated it is
  readers: number;
  genres: string[];
  cover: Cover | null;
  description: string | null;
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

const DESCRIPTION_LENGTH = 600;

const shorten = (text: string) =>
  text.length <= DESCRIPTION_LENGTH
    ? text
    : `${text.slice(0, DESCRIPTION_LENGTH).replace(/\s+\S*$/, "")}…`;

// Writers, not the illustrators, translators and narrators listed with them
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
    const description = book.description?.trim();
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
        description: description ? shorten(description) : null,
      },
    ];
  });
}

export const isOut = (book: UpcomingBook, today: string) =>
  book.releaseDate <= today;

// Month by month, each month's books by release day, the most read first on a
// day. Books out already go newest first, books to come soonest first
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

// The genres I read most, from each logged book's genres
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

// Genres in the list, the most common first
export function genresOf(books: UpcomingBook[]) {
  return favouriteGenres(
    books.map((book) => book.genres),
    Infinity,
  );
}

export const matchesGenres = (book: UpcomingBook, genres: Set<string>) =>
  genres.size === 0 || book.genres.some((genre) => genres.has(genre));

// Titles to compare by: without a subtitle, since Hardcover, Open Library and
// the log don't always agree on one ("Ninth House" or "Ninth House: A Novel")
export const titleKey = (title: string) =>
  normalizeTitle(title.split(/[:(]/)[0]);
