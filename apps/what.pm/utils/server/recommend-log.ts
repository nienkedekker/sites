import type { createClientForServer } from "@/utils/supabase/server";
import { fetchAllRows } from "@/utils/data/fetch-all";
import { getCachedItems } from "@/utils/data/items";

type SupabaseServer = Awaited<ReturnType<typeof createClientForServer>>;

export async function loadLog(supabase: SupabaseServer) {
  const [items, dismissed, wanted] = await Promise.all([
    getCachedItems(),
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
  return { items, dismissed, wanted };
}
