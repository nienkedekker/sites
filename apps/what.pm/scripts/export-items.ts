// node --env-file=.env.local scripts/export-items.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { validateAndTypeItem, type TypedItem } from "../types/shared.ts";
import { fetchAllRows } from "../utils/data/fetch-all.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) throw new Error("Missing Supabase env vars");
const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

const here = dirname(fileURLToPath(import.meta.url));
const target = join(here, "..", "recs", "data", "raw", "whatpm.json");

const rawItems = await fetchAllRows((from, to) =>
  supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: true })
    .order("id")
    .range(from, to),
);

const items: TypedItem[] = rawItems
  .map(validateAndTypeItem)
  .filter((item): item is TypedItem => item !== null);

if (items.length !== rawItems.length) {
  console.warn(`${rawItems.length - items.length} invalid items left out`);
}
if (items.length === 0) throw new Error("No items came back, not writing");

mkdirSync(dirname(target), { recursive: true });
writeFileSync(
  target,
  JSON.stringify(
    { exportedAt: new Date().toISOString(), count: items.length, items },
    null,
    2,
  ),
);
console.log(`Wrote ${items.length} items to ${target}`);
