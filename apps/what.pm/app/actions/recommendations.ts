"use server";

import { revalidatePath, updateTag } from "next/cache";
import { WANTED_TAG } from "@/utils/constants/app";
import { getJson, tmdbUrl } from "@/utils/server/external-api";
import { createClientForServer } from "@/utils/supabase/server";
import {
  dismissSchema,
  pickKeySchema,
  pickKeysSchema,
  upNextSchema,
} from "@/utils/schemas/validation";
import { VALID_ITEM_TYPES, type ValidItemType } from "@/types/shared";

type SupabaseServer = Awaited<ReturnType<typeof createClientForServer>>;

const SIGNED_OUT_ERROR = "Your session has expired. Sign in again.";

async function isSignedIn(supabase: SupabaseServer) {
  const { data } = await supabase.auth.getUser();
  return Boolean(data.user);
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

    revalidatePath("/discover/for-you");
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
    // The pick stays, marked as on up next, until the next batch replaces it

    updateTag(WANTED_TAG);
    revalidatePath("/discover/for-you");
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

    updateTag(WANTED_TAG);
    revalidatePath("/discover/for-you");
    revalidatePath("/up-next");
    return { error: null };
  } catch (error) {
    console.error("Unexpected error in removeWanted:", error);
    return { error: "Something went wrong. Please try again." };
  }
}

export interface PickKey {
  itemtype: ValidItemType;
  externalId: string;
}

// One delete per type, since the key is the pair
async function deleteKeys(
  supabase: SupabaseServer,
  table: "wanted" | "recommendations",
  keys: PickKey[],
) {
  for (const itemtype of VALID_ITEM_TYPES) {
    const ids = keys
      .filter((key) => key.itemtype === itemtype)
      .map((key) => key.externalId);
    if (ids.length === 0) continue;
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("itemtype", itemtype)
      .in("external_id", ids);
    if (error) return error;
  }
  return null;
}

export async function removeWantedMany(
  keys: PickKey[],
): Promise<{ error: string | null }> {
  try {
    const parsed = pickKeysSchema.safeParse(keys);
    if (!parsed.success) return { error: "Invalid request." };

    const supabase = await createClientForServer();
    if (!(await isSignedIn(supabase))) return { error: SIGNED_OUT_ERROR };

    const error = await deleteKeys(supabase, "wanted", parsed.data);
    if (error) {
      console.error("Database error removing wanted items:", error);
      return { error: "Unable to remove those. Please try again." };
    }

    updateTag(WANTED_TAG);
    revalidatePath("/discover/for-you");
    revalidatePath("/up-next");
    return { error: null };
  } catch (error) {
    console.error("Unexpected error in removeWantedMany:", error);
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

    updateTag(WANTED_TAG);
    revalidatePath("/up-next");
    return { error: null };
  } catch (error) {
    console.error("Unexpected error in addUpNext:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
