// node --env-file=.env.local scripts/export-items.ts
//
// With SUPABASE_SERVICE_ROLE_KEY in .env.local the dismissed picks come
// along too; the anon key can't read that table, so without it they stay
// empty and the classifier learns from the log alone.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { validateAndTypeItem, type TypedItem } from "../types/shared.ts";
import { fetchAllRows } from "../utils/data/fetch-all.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey) throw new Error("Missing Supabase env vars");
const supabase = createClient(url, serviceKey ?? anonKey, {
  auth: { persistSession: false },
});

const here = dirname(fileURLToPath(import.meta.url));
const target = join(here, "..", "recs", "data", "raw", "whatpm.json");

const [rawItems, dismissed, wanted] = await Promise.all([
  fetchAllRows((from, to) =>
    supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: true })
      .order("id")
      .range(from, to),
  ),
  fetchAllRows((from, to) =>
    supabase
      .from("dismissed")
      .select("itemtype, external_id, title, kind, created_at")
      .order("created_at")
      .order("external_id")
      .range(from, to),
  ),
  fetchAllRows((from, to) =>
    supabase
      .from("wanted")
      .select("itemtype, external_id, title, creator, published_year, created_at")
      .order("created_at")
      .order("external_id")
      .range(from, to),
  ),
]);

const items: TypedItem[] = rawItems
  .map(validateAndTypeItem)
  .filter((item): item is TypedItem => item !== null);

if (items.length !== rawItems.length) {
  console.warn(`${rawItems.length - items.length} invalid items left out`);
}
if (items.length === 0) throw new Error("No items came back, not writing");
if (!serviceKey) {
  console.warn(
    "No SUPABASE_SERVICE_ROLE_KEY, so dismissed picks weren't read",
  );
}

mkdirSync(dirname(target), { recursive: true });
writeFileSync(
  target,
  JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      count: items.length,
      items,
      dismissed,
      wanted,
    },
    null,
    2,
  ),
);
console.log(
  `Wrote ${items.length} items, ${dismissed.length} dismissed and ${wanted.length} wanted to ${target}`,
);
