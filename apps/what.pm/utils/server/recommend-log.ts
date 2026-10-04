import type { createClientForServer } from "@/utils/supabase/server";
import { fetchAllRows } from "@/utils/data/fetch-all";
import { validateAndTypeItem, type TypedItem } from "@/types/shared";

type SupabaseServer = Awaited<ReturnType<typeof createClientForServer>>;

export async function loadLog(supabase: SupabaseServer) {
  const [rows, dismissed, wanted] = await Promise.all([
    fetchAllRows((from, to) =>
      supabase.from("items").select("*").order("id").range(from, to),
    ),
    fetchAllRows((from, to) =>
      supabase
        .from("dismissed")
        .select("itemtype, external_id, title, kind")
        .order("created_at")
        .range(from, to),
    ),
    fetchAllRows((from, to) =>
      supabase
        .from("wanted")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to),
    ),
  ]);
  const items = rows
    .map(validateAndTypeItem)
    .filter((item): item is TypedItem => item !== null);
  return { items, dismissed, wanted };
}
