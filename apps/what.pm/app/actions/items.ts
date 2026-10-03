"use server";

import { isNextRedirect } from "@/utils/server/error-handling";
import { createClientForServer } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import {
  itemCreationSchema,
  extractFormData,
} from "@/utils/schemas/validation";
import { ItemInsert, ItemUpdate } from "@/types";
import {
  getExternalDetails,
  googleBooksPages,
} from "@/utils/server/external-api";
import { ITEMS_TAG } from "@/utils/constants/app";

type SupabaseServer = Awaited<ReturnType<typeof createClientForServer>>;

const SIGNED_OUT_ERROR = "Your session has expired. Sign in again.";

async function isSignedIn(supabase: SupabaseServer) {
  const { data } = await supabase.auth.getUser();
  return Boolean(data.user);
}

export const createItemAction = async (
  formData: FormData,
): Promise<{ error: string }> => {
  try {
    const supabase = await createClientForServer();
    if (!(await isSignedIn(supabase))) return { error: SIGNED_OUT_ERROR };

    const validation = extractFormData(formData, itemCreationSchema);

    if (!validation.success) {
      return { error: validation.errors.join(", ") };
    }

    const validatedData = validation.data;

    const externalId = validatedData.externalId || null;
    const details = externalId
      ? await getExternalDetails(
          validatedData.itemtype,
          externalId,
          validatedData.season ?? null,
        )
      : null;
    const pages =
      validatedData.itemtype === "Book"
        ? validatedData.pages ||
          details?.pages ||
          (await googleBooksPages(validatedData.title, validatedData.author))
        : null;

    const newItem: ItemInsert = {
      ...details,
      pages,
      external_id: externalId,
      title: validatedData.title,
      itemtype: validatedData.itemtype,
      belongs_to_year: validatedData.belongsToYear,
      published_year: validatedData.publishedYear,
      redo: validatedData.redo || false,
      author: validatedData.author || null,
      director: validatedData.director || null,
      season: validatedData.season || null,
      in_progress:
        "inProgress" in validatedData
          ? (validatedData.inProgress ?? false)
          : null,
    };

    const { data: created, error } = await supabase
      .from("items")
      .insert(newItem)
      .select("id")
      .single();

    if (error) {
      console.error("Database error creating item:", error);
      return { error: "Unable to save your item. Please try again." };
    }

    revalidateTag(ITEMS_TAG);
    return redirect(`/year/${validatedData.belongsToYear}#item-${created.id}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Unexpected error in createItemAction:", error);
    return { error: "Something went wrong. Please try again." };
  }
};

export const deleteItemAction = async (
  formData: FormData,
): Promise<{ error: string }> => {
  try {
    const itemId = formData.get("id")?.toString();
    const belongsToYear = Number(formData.get("belongsToYear"));

    if (!itemId || !Number.isInteger(belongsToYear) || belongsToYear < 1) {
      return { error: "Invalid delete request." };
    }

    const supabase = await createClientForServer();
    if (!(await isSignedIn(supabase))) return { error: SIGNED_OUT_ERROR };

    const { error } = await supabase.from("items").delete().eq("id", itemId);

    if (error) {
      console.error("Database error deleting item:", error);
      return { error: "Unable to delete your item. Please try again." };
    }

    revalidateTag(ITEMS_TAG);
    return redirect(`/year/${belongsToYear}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Unexpected error in deleteItemAction:", error);
    return { error: "Something went wrong. Please try again." };
  }
};

export const updateItemAction = async (
  formData: FormData,
): Promise<{ error: string | null }> => {
  try {
    const itemId = formData.get("id")?.toString();
    const itemType = formData.get("itemtype")?.toString() || "";
    const belongsToYear = Number(formData.get("belongsToYear"));

    if (!itemId || !itemType) {
      return { error: "Invalid update request." };
    }

    const validation = extractFormData(formData, itemCreationSchema);

    if (!validation.success) {
      return { error: validation.errors.join(", ") };
    }

    const validatedData = validation.data;

    const supabase = await createClientForServer();
    if (!(await isSignedIn(supabase))) return { error: SIGNED_OUT_ERROR };

    const updatedItem: ItemUpdate = {
      title: validatedData.title,
      published_year: validatedData.publishedYear,
      belongs_to_year: belongsToYear,
      redo: validatedData.redo || false,
      author: validatedData.author || null,
      director: validatedData.director || null,
      season: validatedData.season || null,
      in_progress:
        "inProgress" in validatedData
          ? (validatedData.inProgress ?? false)
          : null,
      ...(validatedData.itemtype === "Book" && {
        pages: validatedData.pages || null,
      }),
    };

    const { error } = await supabase
      .from("items")
      .update(updatedItem)
      .eq("id", itemId);

    if (error) {
      console.error("Database error updating item:", error);
      return { error: "Unable to update your item. Please try again." };
    }

    revalidateTag(ITEMS_TAG);
    return { error: null };
  } catch (error) {
    console.error("Unexpected error in updateItemAction:", error);
    return { error: "Something went wrong. Please try again." };
  }
};
