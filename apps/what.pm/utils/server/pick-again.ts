import "server-only";
import type { createClientForServer } from "@/utils/supabase/server";
import { loadLog } from "@/utils/server/recommend-log";
import {
  dropReason,
  keepNew,
  knownCreators,
  logIndex,
  PICK_COUNT,
} from "@/utils/data/recommend";
import { lookUp } from "@/utils/server/recommend-lookup";
import { suggestWithClaude } from "@/utils/server/recommend-claude";

type SupabaseServer = Awaited<ReturnType<typeof createClientForServer>>;

export const CANCELLED = "Cancelled.";

// A new batch of picks in place of the last one. Cancelling stops Claude
// where it is, and nothing is saved once the signal has gone
export async function pickAgain(
  supabase: SupabaseServer,
  signal: AbortSignal,
): Promise<{ error: string | null }> {
  const { items, dismissed, wanted } = await loadLog(supabase);
  const suggestions = await suggestWithClaude(
    items,
    dismissed,
    wanted,
    undefined,
    signal,
  );
  if (signal.aborted) return { error: CANCELLED };
  if (!suggestions) {
    return { error: "Claude didn’t come back with picks. Try again." };
  }
  const looked = await lookUp(suggestions);
  if (signal.aborted) return { error: CANCELLED };
  const index = logIndex(items, [...dismissed, ...wanted]);
  const known = knownCreators(items);
  const picks = keepNew(looked, index, known, PICK_COUNT);
  if (picks.length === 0) {
    console.warn(
      "No picks kept:",
      JSON.stringify({
        logged: items.length,
        dismissed: dismissed.length,
        wanted: wanted.length,
        suggestions: looked.map(
          ({ suggestion, found }) =>
            `${suggestion.itemtype} ${suggestion.title} (${suggestion.year}): ${dropReason(found, index, known)}`,
        ),
      }),
    );
    return { error: "None of Claude’s picks checked out. Try again." };
  }

  // The score keeps Claude's order, best first
  const batchAt = new Date().toISOString();
  const rows = picks.map(({ suggestion, found }, rank) => ({
    itemtype: found.itemtype,
    external_id: found.external_id,
    title: found.title,
    creator: found.creator,
    published_year: found.year ?? suggestion.year,
    reason: suggestion.reason,
    because: suggestion.because,
    score: picks.length - rank,
    batch_at: batchAt,
  }));

  // Upsert, then clear the older batch, so a failed save keeps the old picks
  const { error: saveError } = await supabase
    .from("recommendations")
    .upsert(rows, { onConflict: "itemtype,external_id" });
  if (saveError) {
    console.error("Database error saving recommendations:", saveError);
    return { error: "Unable to save the new picks. Please try again." };
  }
  const { error: clearError } = await supabase
    .from("recommendations")
    .delete()
    .lt("batch_at", batchAt);
  if (clearError) {
    console.error("Database error clearing old recommendations:", clearError);
  }
  return { error: null };
}
