// Matches logged items to OpenLibrary/TMDB to fill in external_id, pages,
// runtime_minutes and based_on. It only reads from Supabase; --sql writes the
// updates to a file to check and then run with `supabase db query -f`:
//   npx tsx --env-file=.env.local scripts/backfill-external-details.ts --limit 20
//   npx tsx --env-file=.env.local scripts/backfill-external-details.ts --only "Kafka|Runaways"
//   npx tsx --env-file=.env.local scripts/backfill-external-details.ts \
//     --report matches.tsv --sql backfill.sql
// --refresh skips matching and re-checks items that are already matched but
// still have no page count or runtime, like a season the source added later.
// Books without pages also try Google Books, matched or not:
//   npx tsx --env-file=.env.local scripts/backfill-external-details.ts \
//     --refresh --sql refresh.sql
// --genres fills in genres for matched items that don't have any yet, from
// TMDB for movies and shows and from subjects for books:
//   npx tsx --env-file=.env.local scripts/backfill-external-details.ts \
//     --genres --sql genres.sql
import { writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { validateAndTypeItem, type TypedItem } from "@/types/shared";
import { splitNames } from "@/utils/data/names";
import { normalizeTitle } from "@/utils/data/patterns";
import {
  getExternalDetails,
  getJson,
  googleBooksPages,
  openLibraryJson,
  tmdbUrl,
  yearOf,
  type ExternalDetails,
} from "@/utils/server/external-api";
import {
  cleanTitle,
  overlaps,
  pickBook,
  pickMovie,
  pickShow,
  titleScore,
  type Match,
  type OpenLibraryDoc,
  type TmdbMovie,
  type TmdbShow,
} from "./matching";

const arg = (name: string) => {
  const index = process.argv.indexOf(name);
  return index > -1 ? process.argv[index + 1] : undefined;
};
const limit = Number(arg("--limit") ?? Infinity);
const reportPath = arg("--report");
const sqlPath = arg("--sql");
// e.g. --only "Kafka|Runaways" to retry a few titles
const only = arg("--only");
const refresh = process.argv.includes("--refresh");
const genresOnly = process.argv.includes("--genres");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) throw new Error("Missing Supabase env vars");
const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

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

  const byField = await searchOpenLibrary({ title, author });
  const exact = pickBook(byField, item);
  if (exact) return toMatch(exact, "exact");

  const broad = await searchOpenLibrary({ q: `${title} ${author}` });
  const broadExact = pickBook(broad, item);
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

  // Even the right title and year can be a different film (there's more than
  // one Teeth and Birdman), so the director has to match too
  const picked = pickMovie(results, item);
  if (picked && overlaps(item.director, await directorsOf(picked.id))) {
    return toMatch(picked, "exact");
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
    const sameTitle =
      titleScore(item.title, movie.title, movie.original_title) > 0;
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
  const data = await getJson<{ results: TmdbShow[] }>(
    tmdbUrl("/search/tv", {
      query: cleanTitle(item.title),
      include_adult: "false",
    }),
  );
  const match = pickShow(data.results, item);
  return match
    ? {
        id: String(match.id),
        title: match.name,
        year: yearOf(match.first_air_date),
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

const sqlArray = (values: string[]) =>
  `array[${values.map(sqlValue).join(", ")}]::text[]`;

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
        `genres = ${sqlArray(details!.genres)}`,
      ].join(", ");
      return `update public.items set ${sets} where id = ${sqlValue(item.id)} and external_id is null; -- ${match!.confidence}: ${item.title.replace(/\n/g, " ")}`;
    });
  writeFileSync(path, ["begin;", ...updates, "commit;", ""].join("\n"));
  return updates.length;
}

const missingDetails = (item: TypedItem) =>
  item.itemtype === "Book" ? !item.pages : !item.runtime_minutes;

async function refreshDetails(items: TypedItem[]) {
  const updates: string[] = [];
  for (const item of items) {
    const details: ExternalDetails = item.external_id
      ? await getExternalDetails(
          item.itemtype,
          item.external_id,
          item.season ?? null,
        )
      : { pages: null, runtime_minutes: null, based_on: null, genres: [] };
    if (item.itemtype === "Book" && !details.pages) {
      details.pages = await googleBooksPages(item.title, item.author);
    }
    await sleep(item.itemtype === "Book" ? 600 : 150);
    const label = `${item.itemtype.padEnd(5)} ${item.title}${
      item.season ? ` S${item.season}` : ""
    }`;
    if (!details.pages && !details.runtime_minutes) {
      console.log(`  ·  ${label}: still nothing`);
      continue;
    }
    console.log(`  ✓  ${label} ${JSON.stringify(details)}`);
    // coalesce keeps anything already filled in
    const sets = [
      `pages = coalesce(pages, ${sqlValue(details.pages)})`,
      `runtime_minutes = coalesce(runtime_minutes, ${sqlValue(details.runtime_minutes)})`,
      `based_on = coalesce(based_on, ${sqlValue(details.based_on)})`,
    ].join(", ");
    updates.push(
      `update public.items set ${sets} where id = ${sqlValue(item.id)} and external_id is not distinct from ${sqlValue(item.external_id)}; -- ${item.title.replace(/\n/g, " ")}`,
    );
  }
  return updates;
}

// Seasons of one show share a TMDB id, so each id is looked up once and its
// genres go to every row with it
async function fillGenres(items: TypedItem[]) {
  const byId = new Map<string, TypedItem[]>();
  for (const item of items) {
    const key = `${item.itemtype}|${item.external_id}`;
    byId.set(key, [...(byId.get(key) ?? []), item]);
  }
  const updates: string[] = [];
  for (const [first, ...rest] of byId.values()) {
    const { genres } = await getExternalDetails(
      first.itemtype,
      first.external_id!,
    );
    await sleep(first.itemtype === "Book" ? 600 : 150);
    const label = `${first.itemtype.padEnd(5)} ${first.title}`;
    if (genres.length === 0) {
      console.log(`  ·  ${label}: no genres`);
      continue;
    }
    console.log(`  ✓  ${label} ${genres.join(", ")}`);
    const ids = [first, ...rest].map((item) => sqlValue(item.id)).join(", ");
    updates.push(
      `update public.items set genres = ${sqlArray(genres)} where id in (${ids}) and genres = '{}' and external_id = ${sqlValue(first.external_id)}; -- ${first.title.replace(/\n/g, " ")}`,
    );
  }
  return updates;
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
    .filter((item) =>
      genresOnly
        ? !!item.external_id && item.genres.length === 0
        : refresh
          ? missingDetails(item) &&
            (!!item.external_id || item.itemtype === "Book")
          : !item.external_id,
    )
    .filter((item) => !only || new RegExp(only, "i").test(item.title))
    .slice(0, limit);

  if (genresOnly || refresh) {
    const updates = genresOnly
      ? await fillGenres(items)
      : await refreshDetails(items);
    if (sqlPath) {
      writeFileSync(sqlPath, ["begin;", ...updates, "commit;", ""].join("\n"));
      console.log(`Wrote ${updates.length} updates to ${sqlPath}`);
    }
    console.log(
      `${updates.length} of ${genresOnly ? "the titles" : items.length} now have details. Nothing was saved to the database.`,
    );
    return;
  }

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
