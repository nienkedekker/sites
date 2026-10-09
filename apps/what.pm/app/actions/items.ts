"use server";

import { createClientForServer } from "@/utils/supabase/server";
import { redirect, unstable_rethrow } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import {
  itemCreationSchema,
  extractFormData,
  pickKeySchema,
} from "@/utils/schemas/validation";
import { ItemInsert, ItemUpdate } from "@/types";
import {
  getExternalDetails,
  googleBooksPages,
} from "@/utils/server/external-api";
import { ITEMS_TAG, WANTED_TAG } from "@/utils/constants/app";
import { getCurrentYear } from "@/utils/formatters/date";

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
      // The forms only send inProgress when it's checked
      in_progress:
        validatedData.itemtype === "Movie"
          ? null
          : (validatedData.inProgress ?? false),
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

    updateTag(ITEMS_TAG);
    return redirect(`/year/${validatedData.belongsToYear}#item-${created.id}`);
  } catch (error) {
    unstable_rethrow(error);
    console.error("Unexpected error in createItemAction:", error);
    return { error: "Something went wrong. Please try again." };
  }
};

// Started a book or show from up next: it moves to this year's list, in
// progress. Up next doesn't know seasons, so a show starts at season 1
export const startUpNextAction = async (
  formData: FormData,
): Promise<{ error: string | null }> => {
  try {
    const parsed = pickKeySchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success || parsed.data.itemtype === "Movie") {
      return { error: "Invalid request." };
    }
    const { itemtype } = parsed.data;
    const key = { itemtype, external_id: parsed.data.externalId };
    const isBook = itemtype === "Book";

    const supabase = await createClientForServer();
    if (!(await isSignedIn(supabase))) return { error: SIGNED_OUT_ERROR };

    const { data: wanted, error: readError } = await supabase
      .from("wanted")
      .select("title, creator, published_year")
      .match(key)
      .maybeSingle();
    if (readError || !wanted) {
      console.error("Database error reading up next item:", readError);
      return { error: "Couldn’t find that anymore. Reload the page." };
    }
    const author = isBook ? wanted.creator : null;
    if ((isBook && !author) || !wanted.published_year) {
      return {
        error: isBook
          ? "That one has no author or year, so add it from the log form."
          : "That one has no year, so add it from the log form.",
      };
    }

    const season = isBook ? null : 1;
    const details = await getExternalDetails(itemtype, key.external_id, season);
    const pages = author
      ? details?.pages || (await googleBooksPages(wanted.title, author))
      : null;

    const newItem: ItemInsert = {
      ...details,
      pages,
      external_id: key.external_id,
      title: wanted.title,
      itemtype,
      belongs_to_year: getCurrentYear(),
      published_year: wanted.published_year,
      redo: false,
      author,
      season,
      in_progress: true,
    };

    const { error } = await supabase.from("items").insert(newItem);
    if (error) {
      console.error("Database error starting up next item:", error);
      return { error: "Unable to save that. Please try again." };
    }
    // Up next already hides logged items, so a failed clear only leaves a row
    const { error: clearError } = await supabase
      .from("wanted")
      .delete()
      .match(key);
    if (clearError) {
      console.error("Database error clearing started item:", clearError);
    }

    updateTag(ITEMS_TAG);
    updateTag(WANTED_TAG);
    revalidatePath("/up-next");
    return { error: null };
  } catch (error) {
    console.error("Unexpected error in startUpNextAction:", error);
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

    updateTag(ITEMS_TAG);
    return redirect(`/year/${belongsToYear}`);
  } catch (error) {
    unstable_rethrow(error);
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
        validatedData.itemtype === "Movie"
          ? null
          : (validatedData.inProgress ?? false),
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

    updateTag(ITEMS_TAG);
    return { error: null };
  } catch (error) {
    console.error("Unexpected error in updateItemAction:", error);
    return { error: "Something went wrong. Please try again." };
  }
};
