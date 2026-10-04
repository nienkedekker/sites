"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { WANTED_TAG } from "@/utils/constants/app";
import { getJson, tmdbUrl } from "@/utils/server/external-api";
import { createClientForServer } from "@/utils/supabase/server";
import {
  dismissSchema,
  pickKeySchema,
  upNextSchema,
} from "@/utils/schemas/validation";
import { loadLog } from "@/utils/server/recommend-log";
import { keepNew, knownCreators, logIndex } from "@/utils/data/recommend";
import { lookUp } from "@/utils/server/recommend-lookup";
import { suggestWithClaude } from "@/utils/server/recommend-claude";

type SupabaseServer = Awaited<ReturnType<typeof createClientForServer>>;

const SIGNED_OUT_ERROR = "Your session has expired. Sign in again.";

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
    const parsed = dismissSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Invalid request." };
    const { itemtype, externalId, title, kind } = parsed.data;

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
  const parsed = pickKeySchema.safeParse(Object.fromEntries(formData));
  return parsed.success
    ? { itemtype: parsed.data.itemtype, external_id: parsed.data.externalId }
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
    const { error: clearError } = await supabase
      .from("recommendations")
      .delete()
      .match(key);
    if (clearError) {
      console.error("Database error clearing wanted pick:", clearError);
    }

    revalidateTag(WANTED_TAG);
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

    revalidateTag(WANTED_TAG);
    revalidatePath("/recs");
    revalidatePath("/up-next");
    return { error: null };
  } catch (error) {
    console.error("Unexpected error in removeWanted:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

// Title search has no creator for shows
async function showCreator(id: string) {
  const show = await getJson<{ created_by?: { name: string }[] }>(
    tmdbUrl(`/tv/${id}`),
  );
  const names = show.created_by?.map(({ name }) => name) ?? [];
  return names.length > 0 ? names.join(", ") : null;
}

export async function addUpNext(
  formData: FormData,
): Promise<{ error: string | null }> {
  try {
    const parsed = upNextSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Pick a match from the list first." };
    const { itemtype, externalId, title } = parsed.data;
    const year = Number(formData.get("year"));

    const supabase = await createClientForServer();
    if (!(await isSignedIn(supabase))) return { error: SIGNED_OUT_ERROR };

    const creator =
      parsed.data.creator ||
      (itemtype === "Show"
        ? await showCreator(externalId).catch(() => null)
        : null);
    const { error } = await supabase.from("wanted").upsert(
      {
        itemtype,
        external_id: externalId,
        title,
        creator,
        published_year: Number.isInteger(year) && year > 0 ? year : null,
      },
      { onConflict: "itemtype,external_id" },
    );
    if (error) {
      console.error("Database error adding to up next:", error);
      return { error: "Unable to add that. Please try again." };
    }

    revalidateTag(WANTED_TAG);
    revalidatePath("/up-next");
    return { error: null };
  } catch (error) {
    console.error("Unexpected error in addUpNext:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
