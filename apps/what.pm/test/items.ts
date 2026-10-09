import type { TypedItem } from "@/types/shared";

let nextId = 1;

export function book(overrides: Partial<TypedItem> = {}): TypedItem {
  return {
    id: String(nextId++),
    title: "A Book",
    itemtype: "Book",
    author: "Some Author",
    director: null,
    season: null,
    in_progress: null,
    published_year: 2020,
    belongs_to_year: 2026,
    redo: false,
    did_not_finish: false,
    created_at: "2026-03-15T12:00:00Z",
    updated_at: null,
    external_id: null,
    pages: null,
    runtime_minutes: null,
    based_on: null,
    genres: [],
    subgenres: [],
    ...overrides,
  } as TypedItem;
}

export function movie(overrides: Partial<TypedItem> = {}): TypedItem {
  return book({
    title: "A Movie",
    itemtype: "Movie",
    author: null,
    director: "Some Director",
    ...overrides,
  } as Partial<TypedItem>);
}

export function show(overrides: Partial<TypedItem> = {}): TypedItem {
  return book({
    title: "A Show",
    itemtype: "Show",
    author: null,
    season: 1,
    in_progress: false,
    ...overrides,
  } as Partial<TypedItem>);
}
