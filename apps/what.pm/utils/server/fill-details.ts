import "server-only";
import { validateAndTypeItem, type TypedItem } from "@/types/shared";
import { isUnmatched } from "@/utils/data/external-ids";
import { fetchAllRows } from "@/utils/data/fetch-all";
import { needOf, patchFor, type Need } from "@/utils/data/fill-details";
import type { Match } from "@/utils/data/matching";
import { normalizeTitle } from "@/utils/data/patterns";
import {
  getExternalDetails,
  googleBooksPages,
} from "@/utils/server/external-api";
import { findMatch } from "@/utils/server/find-match";
import { lookUp } from "@/utils/server/recommend-lookup";
import type { AdminClient } from "@/utils/supabase/admin";

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));
// Open Library asks for gentle traffic
const pauseFor = (item: { itemtype: string }) =>
  item.itemtype === "Book" ? 600 : 150;

export interface FillOptions {
  limit: number;
  deadline: number;
}

export interface FillSummary {
  looked: number;
  linked: string[];
  filled: string[];
  loose: string[];
  relinked: string[];
  left: number;
}

const labelOf = (item: TypedItem) =>
  `${item.title}${item.season ? ` S${item.season}` : ""}`;

async function fillItem(
  supabase: AdminClient,
  item: TypedItem,
  need: Need,
  matches: Map<string, Match | null>,
  summary: FillSummary,
) {
  let externalId = item.external_id ?? undefined;
  if (need === "match") {
    // Rereads of one title share a lookup
    const key = `${item.itemtype}|${normalizeTitle(item.title)}|${item.published_year}`;
    if (!matches.has(key)) matches.set(key, await findMatch(item));
    const match = matches.get(key);
    if (!match) return;
    // Only the author matched, so it waits for me to check with the script
    if (match.confidence === "loose") {
      summary.loose.push(`${labelOf(item)} → ${match.title}`);
      return;
    }
    externalId = match.id;
  }

  const details = await getExternalDetails(
    item.itemtype,
    externalId!,
    item.season ?? null,
  );
  if (item.itemtype === "Book" && !details.pages && !item.pages) {
    details.pages = await googleBooksPages(item.title, item.author);
  }
  const patch = patchFor(item, details, externalId);
  if (!patch) return;

  // The guard keeps it from undoing a link I made by hand meanwhile
  const query = supabase.from("items").update(patch).eq("id", item.id);
  const { error } = await (need === "match"
    ? query.is("external_id", null)
    : query.eq("external_id", item.external_id!));
  if (error) throw new Error(`Updating ${item.title}: ${error.message}`);
  (patch.external_id ? summary.linked : summary.filled).push(labelOf(item));
}

async function relinkUpNext(supabase: AdminClient, summary: FillSummary) {
  const { data, error } = await supabase
    .from("wanted")
    .select("itemtype, external_id, title, creator, published_year")
    .like("external_id", "unmatched:%");
  if (error) throw new Error(`Reading up next: ${error.message}`);
  const rows = (data ?? []).filter(
    (row) => isUnmatched(row.external_id) && row.published_year,
  );

  for (const row of rows) {
    const [{ found }] = await lookUp([
      {
        itemtype: row.itemtype,
        title: row.title,
        creator: row.creator ?? "",
        year: row.published_year!,
        reason: "",
        because: [],
      },
    ]);
    if (!found) continue;
    const key = { itemtype: row.itemtype, external_id: row.external_id };
    const { error } = await supabase
      .from("wanted")
      .update({ external_id: found.external_id })
      .match(key);
    // Already up next under its real id, so the placeholder can go
    if (error?.code === "23505") {
      await supabase.from("wanted").delete().match(key);
    } else if (error) {
      throw new Error(`Relinking ${row.title}: ${error.message}`);
    }
    summary.relinked.push(row.title);
  }
}

export async function fillMissingDetails(
  supabase: AdminClient,
  { limit, deadline }: FillOptions,
): Promise<FillSummary> {
  const summary: FillSummary = {
    looked: 0,
    linked: [],
    filled: [],
    loose: [],
    relinked: [],
    left: 0,
  };

  await relinkUpNext(supabase, summary);

  const rows = await fetchAllRows((from, to) =>
    supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, to),
  );
  // Newest first, so what I just logged doesn't wait behind old misses
  const todo = rows
    .map(validateAndTypeItem)
    .filter((item): item is TypedItem => item !== null)
    .map((item) => ({ item, need: needOf(item) }))
    .filter((entry): entry is { item: TypedItem; need: Need } => !!entry.need);

  const matches = new Map<string, Match | null>();
  for (const { item, need } of todo) {
    if (summary.looked >= limit || Date.now() > deadline) break;
    summary.looked++;
    await fillItem(supabase, item, need, matches, summary).catch((error) =>
      console.error(`Filling details for ${item.title} failed:`, error),
    );
    await sleep(pauseFor(item));
  }
  summary.left = todo.length - summary.looked;
  return summary;
}
