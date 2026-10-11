import "server-only";
import type { QueueItem } from "@/components/features/up-next/up-next";
import { getUpNext } from "@/utils/data/up-next";
import { coverOf } from "@/utils/server/covers";
import type { createClientForServer } from "@/utils/supabase/server";

type SupabaseServer = Awaited<ReturnType<typeof createClientForServer>>;

export async function loadQueue(
  supabase: SupabaseServer,
): Promise<QueueItem[]> {
  const [upNext, { data: reasons }] = await Promise.all([
    getUpNext(),
    supabase.from("wanted").select("itemtype, external_id, reason"),
  ]);
  const reasonOf = new Map(
    (reasons ?? []).map((row) => [
      `${row.itemtype}|${row.external_id}`,
      row.reason,
    ]),
  );
  return Promise.all(
    upNext.map(async (item) => ({
      ...item,
      cover: await coverOf(item),
      reason: reasonOf.get(`${item.itemtype}|${item.external_id}`),
    })),
  );
}
