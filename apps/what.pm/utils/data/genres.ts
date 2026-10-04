import type { Route } from "next";
import type { TypedItem } from "@/types/shared";

// Stored with the subgenres, but they say where a book is from or who it's
// about rather than what kind of book it is
export const GENRE_TAGS = new Set([
  "Japanese Fiction",
  "Korean Fiction",
  "Queer Fiction",
]);
export const NO_SUBGENRE = "Other";

// TMDB's TV genres lump these together, so movies are counted the same way
const SHARED_GENRES: Record<string, string> = {
  Action: "Action & Adventure",
  Adventure: "Action & Adventure",
  "Science Fiction": "Sci-Fi & Fantasy",
  Fantasy: "Sci-Fi & Fantasy",
  War: "War & Politics",
};

export function genresOf(item: TypedItem): string[] {
  if (item.itemtype === "Book") return item.genres;
  return [...new Set(item.genres.map((name) => SHARED_GENRES[name] ?? name))];
}

// The first subgenre is the main one; a second stays in the data
export const mainSubgenre = (item: TypedItem) =>
  item.subgenres.find((name) => !GENRE_TAGS.has(name)) ?? NO_SUBGENRE;

// Every genre page as [genre] or [genre, subgenre] slugs, the subgenres
// counted the way itemsInGenre matches them
export function genreSlugs(items: TypedItem[]): string[][] {
  const paths = new Map<string, string[]>();
  for (const item of items) {
    const subs = [
      mainSubgenre(item),
      ...item.subgenres.filter((name) => GENRE_TAGS.has(name)),
    ];
    for (const genre of genresOf(item)) {
      for (const path of [[genre], ...subs.map((sub) => [genre, sub])]) {
        const slugs = path.map(genreSlug);
        paths.set(slugs.join("/"), slugs);
      }
    }
  }
  return [...paths.values()];
}

export const genreSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Typed routes can't express the bare /genres/[genre] form of the optional
// catch-all, so the path is asserted
export const genrePath = (genre: string, subgenre?: string) =>
  `/genres/${genreSlug(genre)}${subgenre ? `/${genreSlug(subgenre)}` : ""}` as Route;

export interface GenreItems {
  genre: string;
  subgenre: string | null;
  items: TypedItem[];
}

// Everything logged under a genre, or under one of its subgenres or tags,
// newest first. Null when nothing matches the slugs.
export function itemsInGenre(
  items: TypedItem[],
  genre: string,
  subgenre?: string,
): GenreItems | null {
  let genreName: string | null = null;
  let subName: string | null = null;
  const matches = items.filter((item) => {
    const name = genresOf(item).find((g) => genreSlug(g) === genre);
    if (!name) return false;
    genreName = name;
    if (!subgenre) return true;
    // Matches the stats: a subgenre by each item's main one, a tag anywhere
    const sub = [
      mainSubgenre(item),
      ...item.subgenres.filter((name) => GENRE_TAGS.has(name)),
    ].find((name) => genreSlug(name) === subgenre);
    if (!sub) return false;
    subName = sub;
    return true;
  });
  if (!genreName || matches.length === 0) return null;
  return {
    genre: genreName,
    subgenre: subName,
    items: matches.sort(
      (a, b) =>
        b.belongs_to_year - a.belongs_to_year ||
        (b.created_at ?? "").localeCompare(a.created_at ?? ""),
    ),
  };
}
