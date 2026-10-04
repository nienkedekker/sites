"use server";

import { revalidatePath } from "next/cache";
import { createClientForServer } from "@/utils/supabase/server";
import { VALID_ITEM_TYPES, type ValidItemType } from "@/types/shared";
import { loadLog } from "@/utils/server/recommend-log";
import { keepNew, knownCreators, logIndex } from "@/utils/data/recommend";
import { lookUp } from "@/utils/server/recommend-lookup";
import { suggestWithClaude } from "@/utils/server/recommend-claude";

type SupabaseServer = Awaited<ReturnType<typeof createClientForServer>>;

const SIGNED_OUT_ERROR = "Your session has expired. Sign in again.";
const DISMISS_KINDS = ["not_for_me", "seen"] as const;

async function isSignedIn(supabase: SupabaseServer) {
  const { data } = await supabase.auth.getUser();
  return Boolean(data.user);
}

export async function refreshRecommendations(): Promise<{
  error: string | null;
}> {
  try {
    const supabase = await createClientForServer();
    if (!(await isSignedIn(supabase))) return { error: SIGNED_OUT_ERROR };

    if (!process.env.ANTHROPIC_API_KEY) {
      return { error: "Picks need an ANTHROPIC_API_KEY." };
    }
    const { items, dismissed, wanted } = await loadLog(supabase);
    const suggestions = await suggestWithClaude(items, dismissed, wanted);
    if (!suggestions) {
      return { error: "Claude didn’t come back with picks. Try again." };
    }
    const picks = keepNew(
      await lookUp(suggestions),
      logIndex(items, [...dismissed, ...wanted]),
      knownCreators(items),
    );
    if (picks.length === 0) {
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

    revalidatePath("/recs");
    return { error: null };
  } catch (error) {
    console.error("Unexpected error in refreshRecommendations:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function dismissRecommendation(
  formData: FormData,
): Promise<{ error: string | null }> {
  try {
    const itemtype = formData.get("itemtype")?.toString() as ValidItemType;
    const externalId = formData.get("externalId")?.toString();
    const title = formData.get("title")?.toString();
    const kind = formData
      .get("kind")
      ?.toString() as (typeof DISMISS_KINDS)[number];
    if (
      !VALID_ITEM_TYPES.includes(itemtype) ||
      !externalId ||
      !title ||
      !DISMISS_KINDS.includes(kind)
    ) {
      return { error: "Invalid request." };
    }

    const supabase = await createClientForServer();
    if (!(await isSignedIn(supabase))) return { error: SIGNED_OUT_ERROR };

    const { error } = await supabase
      .from("dismissed")
      .upsert(
        { itemtype, external_id: externalId, title, kind },
        { onConflict: "itemtype,external_id" },
      );
    if (error) {
      console.error("Database error dismissing recommendation:", error);
      return { error: "Unable to hide that pick. Please try again." };
    }

    revalidatePath("/recs");
    return { error: null };
  } catch (error) {
    console.error("Unexpected error in dismissRecommendation:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

function pickKey(formData: FormData) {
  const itemtype = formData.get("itemtype")?.toString() as ValidItemType;
  const externalId = formData.get("externalId")?.toString();
  return VALID_ITEM_TYPES.includes(itemtype) && externalId
    ? { itemtype, external_id: externalId }
    : null;
}

export async function wantRecommendation(
  formData: FormData,
): Promise<{ error: string | null }> {
  try {
    const key = pickKey(formData);
    if (!key) return { error: "Invalid request." };

    const supabase = await createClientForServer();
    if (!(await isSignedIn(supabase))) return { error: SIGNED_OUT_ERROR };

    const { data: rec, error: readError } = await supabase
      .from("recommendations")
      .select("title, creator, published_year, reason, because")
      .match(key)
      .maybeSingle();
    if (readError || !rec) {
      console.error("Database error reading recommendation:", readError);
      return { error: "Couldn’t find that pick anymore. Reload the page." };
    }

    const { error } = await supabase
      .from("wanted")
      .upsert({ ...key, ...rec }, { onConflict: "itemtype,external_id" });
    if (error) {
      console.error("Database error saving wanted item:", error);
      return { error: "Unable to save that pick. Please try again." };
    }
    await supabase.from("recommendations").delete().match(key);

    revalidatePath("/recs");
    return { error: null };
  } catch (error) {
    console.error("Unexpected error in wantRecommendation:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function removeWanted(
  formData: FormData,
): Promise<{ error: string | null }> {
  try {
    const key = pickKey(formData);
    if (!key) return { error: "Invalid request." };

    const supabase = await createClientForServer();
    if (!(await isSignedIn(supabase))) return { error: SIGNED_OUT_ERROR };

    const { error } = await supabase.from("wanted").delete().match(key);
    if (error) {
      console.error("Database error removing wanted item:", error);
      return { error: "Unable to remove that. Please try again." };
    }

    revalidatePath("/recs");
    return { error: null };
  } catch (error) {
    console.error("Unexpected error in removeWanted:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
