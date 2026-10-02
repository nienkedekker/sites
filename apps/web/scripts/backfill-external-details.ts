// Matches logged items to OpenLibrary/TMDB to fill in external_id, pages,
// runtime_minutes and based_on. It only reads from Supabase; --sql writes the
// updates to a file to check and then run with `supabase db query -f`:
//   npx tsx --env-file=.env.local scripts/backfill-external-details.ts --limit 20
//   npx tsx --env-file=.env.local scripts/backfill-external-details.ts --only "Kafka|Runaways"
//   npx tsx --env-file=.env.local scripts/backfill-external-details.ts \
//     --report matches.tsv --sql backfill.sql
import { writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { validateAndTypeItem, type TypedItem } from "@/types/shared";
import { splitNames } from "@/utils/data/names";
import { normalizeTitle } from "@/utils/data/patterns";
import {
  getExternalDetails,
  getJson,
  openLibraryJson,
  tmdbUrl,
  yearOf,
  type ExternalDetails,
} from "@/utils/server/external-api";

const arg = (name: string) => {
  const index = process.argv.indexOf(name);
  return index > -1 ? process.argv[index + 1] : undefined;
};
const limit = Number(arg("--limit") ?? Infinity);
const reportPath = arg("--report");
const sqlPath = arg("--sql");
// e.g. --only "Kafka|Runaways" to retry a few titles
const only = arg("--only");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) throw new Error("Missing Supabase env vars");
const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

interface Match {
  id: string;
  title: string;
  year: number | null;
  // "loose" matches are worth a look before trusting them
  confidence: "exact" | "loose";
}

// Logged titles sometimes carry how I watched it ("3D", "IMAX", "(The Final
// Cut)") or a note ("(Q&A)"), which the sources don't have
const cleanTitle = (title: string) =>
  title
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(IMAX|3D)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

// 2 for the same title, 1 when the source only adds a subtitle ("Wolf Hall:
// A Novel"), 0 otherwise. A logged "Mistborn: The Hero of Ages" never
// matches plain "Mistborn"
function titleScore(logged: string, ...candidates: (string | undefined)[]) {
  const wanted = normalizeTitle(cleanTitle(logged));
  let score = 0;
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (normalizeTitle(candidate) === wanted) return 2;
    // "Marvel's Runaways", "Tom Clancy's Jack Ryan"
    if (normalizeTitle(candidate.replace(/^[^:]*?['’]s\s+/, "")) === wanted) {
      return 2;
    }
    if (normalizeTitle(candidate.split(":")[0]) === wanted) score = 1;
  }
  return score;
}

// Full-title matches first, keeping the source's own ranking within each
function byTitle<T>(items: T[], score: (item: T) => number) {
  return [
    ...items.filter((item) => score(item) === 2),
    ...items.filter((item) => score(item) === 1),
  ];
}

const overlaps = (names: string | null | undefined, others: string[]) =>
  splitNames(names ?? null).some((name) =>
    others.some((other) => normalizeTitle(name) === normalizeTitle(other)),
  );

interface OpenLibraryDoc {
  key: string;
  title: string;
  first_publish_year?: number;
  author_name?: string[];
}

async function searchOpenLibrary(params: Record<string, string>) {
  const url = new URL("https://openlibrary.org/search.json");
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value);
  }
  url.searchParams.set("fields", "key,title,first_publish_year,author_name");
  url.searchParams.set("limit", "10");
  const data = await openLibraryJson<{ docs: OpenLibraryDoc[] }>(url);
  return data.docs;
}

async function findBook(item: TypedItem): Promise<Match | null> {
  const title = cleanTitle(item.title);
  const author = splitNames(item.author)[0] ?? "";
  const toMatch = (doc: OpenLibraryDoc, confidence: Match["confidence"]) => ({
    id: doc.key,
    title: doc.title,
    year: doc.first_publish_year ?? null,
    confidence,
  });

  const score = (doc: OpenLibraryDoc) => titleScore(item.title, doc.title);

  const byField = await searchOpenLibrary({ title, author });
  const [exact] = byTitle(byField, score);
  if (exact) return toMatch(exact, "exact");

  const broad = await searchOpenLibrary({ q: `${title} ${author}` });
  const [broadExact] = byTitle(broad, score);
  if (broadExact) return toMatch(broadExact, "exact");

  // Translations are often filed under the original title (海辺のカフカ for
  // Kafka on the Shore), so fall back to the best hit by the same author
  const byAuthor = broad.find(
    (doc) =>
      overlaps(item.author, doc.author_name ?? []) &&
      !/study guide|summary|analysis|sparknotes/i.test(doc.title),
  );
  return byAuthor ? toMatch(byAuthor, "loose") : null;
}

interface TmdbMovie {
  id: number;
  title: string;
  original_title?: string;
  release_date?: string;
}

async function searchMovies(query: string) {
  const data = await getJson<{ results: TmdbMovie[] }>(
    tmdbUrl("/search/movie", { query, include_adult: "false" }),
  );
  return data.results;
}

async function directorsOf(id: number) {
  const data = await getJson<{ crew: { job: string; name: string }[] }>(
    tmdbUrl(`/movie/${id}/credits`),
  );
  return data.crew
    .filter((person) => person.job === "Director")
    .map((person) => person.name);
}

async function findMovie(item: TypedItem): Promise<Match | null> {
  const title = cleanTitle(item.title);
  const results = await searchMovies(title);
  const toMatch = (movie: TmdbMovie, confidence: Match["confidence"]) => ({
    id: String(movie.id),
    title: movie.title,
    year: yearOf(movie.release_date),
    confidence,
  });

  const score = (movie: TmdbMovie) =>
    titleScore(item.title, movie.title, movie.original_title);

  // "Dune" logged for 2021 should find Dune (2021) before Dune: Part Two
  for (const level of [2, 1]) {
    const titled = results.filter((movie) => score(movie) === level);
    for (const tolerance of [0, 1, 2]) {
      const match = titled.find((movie) => {
        const year = yearOf(movie.release_date);
        return (
          year !== null && Math.abs(year - item.published_year) <= tolerance
        );
      });
      if (match) return toMatch(match, "exact");
    }
  }

  // Titles that don't line up ("Star Wars I: The Phantom Menace", "Mad Max:
  // Furiosa") or years that are off: accept a result if the director matches
  const queries = [
    ...new Set([title, ...title.split(":").map((part) => part.trim())]),
  ].filter((query) => query.length > 2);
  const candidates = new Map<number, TmdbMovie>();
  for (const query of queries) {
    const found = query === title ? results : await searchMovies(query);
    for (const movie of found.slice(0, 5)) candidates.set(movie.id, movie);
  }

  for (const movie of candidates.values()) {
    const year = yearOf(movie.release_date);
    const sameTitle = score(movie) > 0;
    const closeYear =
      year !== null && Math.abs(year - item.published_year) <= 1;
    if (!sameTitle && !closeYear) continue;
    if (overlaps(item.director, await directorsOf(movie.id))) {
      return toMatch(movie, sameTitle ? "exact" : "loose");
    }
  }
  return null;
}

async function findShow(item: TypedItem): Promise<Match | null> {
  const data = await getJson<{
    results: {
      id: number;
      name: string;
      original_name?: string;
      first_air_date?: string;
    }[];
  }>(
    tmdbUrl("/search/tv", {
      query: cleanTitle(item.title),
      include_adult: "false",
    }),
  );
  // A season can't air before its show started. Only full titles count, so a
  // spin-off ("The Expanse: One Ship") can't stand in for the show, and the
  // exact spelling wins over one that only differs by "The" (Runaways 2017,
  // not The Runaways 1978). Otherwise TMDB's popularity order decides.
  const wanted = cleanTitle(item.title).toLowerCase();
  const eligible = data.results
    .map((show) => ({ ...show, year: yearOf(show.first_air_date) }))
    .filter(
      (show) =>
        titleScore(item.title, show.name, show.original_name) === 2 &&
        show.year !== null &&
        show.year <= item.published_year + 1,
    );
  const prefer = (shows: typeof eligible) =>
    shows.find((show) => show.name.toLowerCase() === wanted) ?? shows[0];
  // A first season airs the year the show starts
  const starting =
    item.season === 1
      ? eligible.filter(
          (show) => Math.abs(show.year! - item.published_year) <= 1,
        )
      : [];
  const match = prefer(starting.length > 0 ? starting : eligible);
  return match
    ? {
        id: String(match.id),
        title: match.name,
        year: match.year,
        confidence: "exact",
      }
    : null;
}

interface Result {
  item: TypedItem;
  match: Match | null;
  details: ExternalDetails | null;
}

async function lookUp(items: TypedItem[], pause: number) {
  const results: Result[] = [];
  const seen = new Map<string, Match | null>();

  for (const item of items) {
    const titleKey = `${item.itemtype}|${normalizeTitle(item.title)}|${item.published_year}`;
    let match = seen.get(titleKey);
    if (match === undefined) {
      const find =
        item.itemtype === "Book"
          ? findBook
          : item.itemtype === "Movie"
            ? findMovie
            : findShow;
      match = await find(item).catch((error) => {
        console.error(`     lookup failed for ${item.title}: ${error}`);
        return null;
      });
      seen.set(titleKey, match);
      await sleep(pause);
    }

    const details = match
      ? await getExternalDetails(item.itemtype, match.id, item.season ?? null)
      : null;
    results.push({ item, match, details });

    const label = `${item.itemtype.padEnd(5)} ${item.title}${
      item.season ? ` S${item.season}` : ""
    }`;
    console.log(
      match
        ? `  ${match.confidence === "exact" ? "✓" : "?"}  ${label} → ${match.title} (${match.year ?? "?"}) ${JSON.stringify(details)}`
        : `  ·  ${label}: no confident match`,
    );
  }
  return results;
}

const sqlValue = (value: string | number | null) =>
  value === null
    ? "null"
    : typeof value === "number"
      ? String(value)
      : `'${value.replace(/'/g, "''")}'`;

// Only touches the new columns, and only rows that are still unmatched, so
// running the file twice is harmless
function writeSql(results: Result[], path: string) {
  const updates = results
    .filter((result) => result.match && result.details)
    .map(({ item, match, details }) => {
      const sets = [
        `external_id = ${sqlValue(match!.id)}`,
        `pages = ${sqlValue(details!.pages)}`,
        `runtime_minutes = ${sqlValue(details!.runtime_minutes)}`,
        `based_on = ${sqlValue(details!.based_on)}`,
      ].join(", ");
      return `update public.items set ${sets} where id = ${sqlValue(item.id)} and external_id is null; -- ${match!.confidence}: ${item.title.replace(/\n/g, " ")}`;
    });
  writeFileSync(path, ["begin;", ...updates, "commit;", ""].join("\n"));
  return updates.length;
}

function report(results: Result[], path: string) {
  const clean = (value: unknown) =>
    String(value ?? "").replace(/[\t\n]+/g, " ");
  const header = [
    "status",
    "type",
    "title",
    "season",
    "published",
    "logged_for",
    "creator",
    "external_id",
    "matched_title",
    "matched_year",
    "pages",
    "runtime_minutes",
    "based_on",
  ];
  const rows = results.map(({ item, match, details }) =>
    [
      match ? match.confidence : "missing",
      item.itemtype,
      item.title,
      item.season,
      item.published_year,
      item.belongs_to_year,
      item.author ?? item.director,
      match?.id,
      match?.title,
      match?.year,
      details?.pages,
      details?.runtime_minutes,
      details?.based_on,
    ]
      .map(clean)
      .join("\t"),
  );
  writeFileSync(path, [header.join("\t"), ...rows].join("\n") + "\n");
}

async function main() {
  const rows: unknown[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order("id")
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const items = rows
    .map(validateAndTypeItem)
    .filter((item): item is TypedItem => item !== null)
    .filter((item) => !item.external_id)
    .filter((item) => !only || new RegExp(only, "i").test(item.title))
    .slice(0, limit);

  // OpenLibrary asks for gentle traffic, TMDB allows much more, so run the
  // two side by side at their own pace
  const [books, screens] = await Promise.all([
    lookUp(
      items.filter((item) => item.itemtype === "Book"),
      600,
    ),
    lookUp(
      items.filter((item) => item.itemtype !== "Book"),
      150,
    ),
  ]);
  const results = [...books, ...screens];

  if (reportPath) report(results, reportPath);
  if (sqlPath) {
    console.log(`Wrote ${writeSql(results, sqlPath)} updates to ${sqlPath}`);
  }

  for (const type of ["Book", "Movie", "Show"] as const) {
    const ofType = results.filter(({ item }) => item.itemtype === type);
    const exact = ofType.filter(({ match }) => match?.confidence === "exact");
    const loose = ofType.filter(({ match }) => match?.confidence === "loose");
    console.log(
      `${type.padEnd(5)} ${exact.length + loose.length} of ${ofType.length} matched (${loose.length} loose)`,
    );
  }
  console.log("Nothing was saved to the database.");
}

main();
