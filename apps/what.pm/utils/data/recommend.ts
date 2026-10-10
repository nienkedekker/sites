import type { TypedItem, ValidItemType } from "@/types/shared";
import { nameKey, splitNames } from "@/utils/data/names";
import { normalizeTitle } from "@/utils/data/patterns";
import { localDate } from "@/utils/formatters/date";

export interface Suggestion {
  itemtype: ValidItemType;
  title: string;
  creator: string;
  year: number;
  reason: string;
  because: string[];
}

export interface Found {
  itemtype: ValidItemType;
  external_id: string;
  title: string;
  creator: string | null;
  year: number | null;
  based_on?: string | null;
}

export interface Dismissal {
  itemtype: string;
  external_id: string;
}

const HALF_LIFE_YEARS = 2;
const DAY = 86_400_000;
const YEAR = 365.25 * DAY;
const SEED_COUNT = 60;
export const PICK_COUNT = 12;
// More than are shown, since some won't be found or turn out to be known
export const SUGGESTION_COUNT = 18;
// Picking one type again keeps its share of the page
export const TYPE_PICK_COUNT = PICK_COUNT / 3;
export const TYPE_SUGGESTION_COUNT = 8;
const RECENT_YEARS = 3;
const FAVOURITE_COUNT = 15;

export const creatorOf = (item: TypedItem) =>
  item.itemtype === "Book"
    ? item.author
    : item.itemtype === "Movie"
      ? item.director
      : null;

const showKey = (item: TypedItem) =>
  item.external_id ?? normalizeTitle(item.title);

// Older years were imported in bulk, so their created_at is the import date
function loggedAt(item: TypedItem) {
  const created = item.created_at ? Date.parse(item.created_at) : NaN;
  if (
    !Number.isNaN(created) &&
    localDate(new Date(created)).year === item.belongs_to_year
  ) {
    return created;
  }
  return Date.UTC(item.belongs_to_year, 6, 1);
}

export function seedWeights(
  items: TypedItem[],
  now = new Date(),
): Map<string, number> {
  const byCreator = new Map<string, number>();
  const seasons = new Map<string, Set<number>>();
  for (const item of items) {
    for (const name of splitNames(creatorOf(item))) {
      byCreator.set(nameKey(name), (byCreator.get(nameKey(name)) ?? 0) + 1);
    }
    if (item.itemtype === "Show") {
      const logged = seasons.get(showKey(item)) ?? new Set<number>();
      logged.add(item.season);
      seasons.set(showKey(item), logged);
    }
  }

  const weights = new Map<string, number>();
  for (const item of items) {
    const repeat =
      item.itemtype === "Show"
        ? (seasons.get(showKey(item))?.size ?? 1)
        : Math.max(
            1,
            ...splitNames(creatorOf(item)).map(
              (name) => byCreator.get(nameKey(name)) ?? 0,
            ),
          );
    const age = Math.max(0, now.getTime() - loggedAt(item)) / YEAR;
    weights.set(
      item.id,
      repeat * (item.redo ? 2 : 1) * 0.5 ** (age / HALF_LIFE_YEARS),
    );
  }
  return weights;
}

export function pickSeeds(
  items: TypedItem[],
  weights: Map<string, number>,
  count = SEED_COUNT,
): TypedItem[] {
  const byWork = new Map<string, TypedItem>();
  const weight = (item: TypedItem) => weights.get(item.id) ?? 0;
  for (const item of items) {
    if (!item.external_id) continue;
    const key = `${item.itemtype}|${item.external_id}`;
    const current = byWork.get(key);
    if (!current || weight(item) > weight(current)) byWork.set(key, item);
  }
  const ranked = [...byWork.values()].sort((a, b) => weight(b) - weight(a));
  const seeds = new Set(ranked.slice(0, count));
  for (const item of ranked) {
    if (item.redo) seeds.add(item);
  }
  return [...seeds];
}

const COLLECTION = [
  /\bseries\s*(\([^)]*\))?\s*$/i,
  /\bbox(ed)?[\s-]*set\b/i,
  /\bomnibus\b/i,
  /\b(duology|trilogy|quartet)\b/i,
  /\bbooks?\s*\d+\s*(-|–|to|&|and|through)\s*\d+/i,
  /\bcollection\s*(\([^)]*\))?\s*$/i,
  /\bcomplete\s+(series|novels|works|collection)\b/i,
];

export const isCollection = (candidate: Pick<Found, "itemtype" | "title">) =>
  candidate.itemtype === "Book" &&
  COLLECTION.some((pattern) => pattern.test(candidate.title));

export function knownCreators(items: TypedItem[]): Set<string> {
  return new Set(
    items.flatMap((item) => splitNames(creatorOf(item)).map(nameKey)),
  );
}

export function isByKnownCreator(
  candidate: Pick<Found, "creator" | "based_on">,
  known: Set<string>,
) {
  return [
    ...splitNames(candidate.creator),
    ...splitNames(candidate.based_on ?? null),
  ].some((name) => known.has(nameKey(name)));
}

export function promptItems(
  items: TypedItem[],
  seeds: TypedItem[],
  now = new Date(),
): TypedItem[] {
  const since = now.getUTCFullYear() - RECENT_YEARS + 1;
  const seedIds = new Set(seeds.map((seed) => seed.id));
  return items
    .filter(
      (item) =>
        item.belongs_to_year >= since || item.redo || seedIds.has(item.id),
    )
    .sort(
      (a, b) =>
        b.belongs_to_year - a.belongs_to_year ||
        (b.created_at ?? "").localeCompare(a.created_at ?? ""),
    );
}

export function favouriteCreators(
  items: TypedItem[],
  itemtype: "Book" | "Movie",
  hidden: ReadonlySet<string> = new Set(),
  count = FAVOURITE_COUNT,
) {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (item.itemtype !== itemtype) continue;
    for (const name of splitNames(creatorOf(item))) {
      if (!hidden.has(name)) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return [...counts]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, count)
    .map(([name, logged]) => `${name} (${logged})`);
}

const VOLUME = /^(.*?)[\s,:(–-]*(?:\bvol(?:ume)?\.?|#)\s*(\d+)\b.*$/i;

// "Chainsaw Man, Vol. 2" and "Berserk Volume 2" are volume 2 of a series
export function volumeOf(title: string) {
  const match = title.match(VOLUME);
  if (!match || !normalizeTitle(match[1])) return null;
  return { series: normalizeTitle(match[1]), volume: Number(match[2]) };
}

// Books drop their subtitle, since OpenLibrary and Google Books often
// disagree on it. Screens keep the whole title, or "Alien: Romulus" would
// match "Alien".
function titleKey(itemtype: string, title: string) {
  const volume = volumeOf(title);
  if (volume) return `${itemtype}|${volume.series}|${volume.volume}`;
  const main = itemtype === "Book" ? title.split(":")[0] : title;
  return `${itemtype}|${normalizeTitle(main)}`;
}

export interface LogIndex {
  ids: Set<string>;
  titles: Map<string, Set<string>>;
}

export function logIndex(
  items: TypedItem[],
  dismissed: Dismissal[] = [],
): LogIndex {
  const ids = new Set<string>();
  const titles = new Map<string, Set<string>>();
  for (const entry of [...items, ...dismissed]) {
    if (entry.external_id) ids.add(`${entry.itemtype}|${entry.external_id}`);
  }
  for (const item of items) {
    const key = titleKey(item.itemtype, item.title);
    const creators = titles.get(key) ?? new Set<string>();
    for (const name of splitNames(creatorOf(item))) creators.add(nameKey(name));
    titles.set(key, creators);
  }
  return { ids, titles };
}

export function isLogged(
  candidate: Pick<Found, "external_id" | "title" | "creator"> & {
    itemtype: string;
  },
  index: LogIndex,
) {
  if (index.ids.has(`${candidate.itemtype}|${candidate.external_id}`)) {
    return true;
  }
  const creators = index.titles.get(
    titleKey(candidate.itemtype, candidate.title),
  );
  if (!creators) return false;
  return splitNames(candidate.creator).some((name) =>
    creators.has(nameKey(name)),
  );
}

// Up next keeps an entry until it's logged after being added, so something
// read before can go back on the list for a reread
export function loggedSinceAdded(
  entry: Parameters<typeof isLogged>[0] & { created_at: string },
  items: TypedItem[],
) {
  const added = Date.parse(entry.created_at);
  const since = items.filter(
    (item) => item.created_at && Date.parse(item.created_at) >= added,
  );
  return isLogged(entry, logIndex(since));
}

type SavedPick = Parameters<typeof isLogged>[0] & {
  reason: string | null;
  created_at: string;
};

export interface LoggedPick<T extends SavedPick> {
  pick: T;
  item: TypedItem;
  days: number;
}

// Claude's picks that I saved and then logged, each with the first entry it
// became, newest first. Picks I added myself have no reason, so they're left out.
export function loggedPicks<T extends SavedPick>(
  wanted: T[],
  items: TypedItem[],
): LoggedPick<T>[] {
  const entries = [...items]
    .filter((item) => item.created_at)
    .sort((a, b) => a.created_at!.localeCompare(b.created_at!))
    .map((item) => ({ item, index: logIndex([item]) }));

  return wanted
    .flatMap((pick) => {
      if (!pick.reason) return [];
      const entry = entries.find(({ index }) => isLogged(pick, index));
      if (!entry) return [];
      const waited =
        Date.parse(entry.item.created_at!) - Date.parse(pick.created_at);
      return [
        {
          pick,
          item: entry.item,
          days: Math.max(0, Math.round(waited / DAY)),
        },
      ];
    })
    .sort((a, b) => b.item.created_at!.localeCompare(a.item.created_at!));
}

export function knownNames(items: TypedItem[]): string[] {
  const names = new Map<string, string>();
  for (const item of items) {
    for (const name of splitNames(creatorOf(item))) {
      if (!names.has(nameKey(name))) names.set(nameKey(name), name);
    }
  }
  return [...names.values()].sort((a, b) => a.localeCompare(b));
}

const foundKey = (found: Found) => `${found.itemtype}|${found.external_id}`;

// Why a looked-up suggestion is left out, or null when it's kept
export function dropReason(
  found: Found | null,
  index: LogIndex,
  known: Set<string>,
  seen: ReadonlySet<string> = new Set(),
): string | null {
  if (!found) return "not found";
  if (seen.has(foundKey(found))) return "suggested twice";
  if (isLogged(found, index)) return "logged, dismissed or wanted";
  if (isByKnownCreator(found, known)) {
    return `known creator (${[found.creator, found.based_on].filter(Boolean).join(", ")})`;
  }
  if (isCollection(found)) return "collection";
  return null;
}

export function keepNew(
  looked: { suggestion: Suggestion; found: Found | null }[],
  index: LogIndex,
  known: Set<string>,
  count = PICK_COUNT,
) {
  const seen = new Set<string>();
  const kept: { suggestion: Suggestion; found: Found }[] = [];
  for (const { suggestion, found } of looked) {
    if (kept.length === count) break;
    if (!found || dropReason(found, index, known, seen)) continue;
    seen.add(foundKey(found));
    kept.push({ suggestion, found });
  }
  return kept;
}
