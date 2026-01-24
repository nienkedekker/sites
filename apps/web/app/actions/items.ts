"use server";

import { encodedRedirect } from "@/utils/server/redirects";
import { isNextRedirect } from "@/utils/server/error-handling";
import { createClientForServer } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  itemCreationSchema,
  extractFormData,
} from "@/utils/schemas/validation";
import { getCurrentYear } from "@/utils/formatters/date";
import { ItemInsert, ItemUpdate } from "@/types";

export const createItemAction = async (formData: FormData) => {
  try {
    const validation = extractFormData(formData, itemCreationSchema);

    if (!validation.success) {
      const errorMessage = validation.errors.join(", ");
      return encodedRedirect("error", "/create", errorMessage);
    }

    const validatedData = validation.data;

    const supabase = await createClientForServer();
    const currentYear = getCurrentYear();

    const newItem: ItemInsert = {
      title: validatedData.title,
      itemtype: validatedData.itemtype,
      belongs_to_year: currentYear,
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

    const { error } = await supabase.from("items").insert(newItem);

    if (error) {
      console.error("Database error creating item:", error);
      return encodedRedirect(
        "error",
        "/create",
        "Unable to save your item. Please try again.",
      );
    }

    return redirect(`/year/${currentYear}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Unexpected error in createItemAction:", error);
    return encodedRedirect(
      "error",
      "/create",
      "Something went wrong. Please try again.",
    );
  }
};

export const deleteItemAction = async (formData: FormData) => {
  try {
    const supabase = await createClientForServer();
    const itemId = formData.get("id")?.toString();
    const belongsToYear = Number(formData.get("belongsToYear"));

    if (!itemId) {
      return encodedRedirect("error", "/", "Item ID is required for deletion.");
    }

    const { error } = await supabase.from("items").delete().eq("id", itemId);

    if (error) {
      console.error("Database error deleting item:", error);
      return encodedRedirect(
        "error",
        "/",
        "Unable to delete your item. Please try again.",
      );
    }

    return redirect(`/year/${belongsToYear}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Unexpected error in deleteItemAction:", error);
    return encodedRedirect(
      "error",
      "/",
      "Something went wrong. Please try again.",
    );
  }
};

export const updateItemAction = async (formData: FormData) => {
  try {
    const itemId = formData.get("id")?.toString();
    const itemType = formData.get("itemtype")?.toString() || "";
    const belongsToYear = Number(formData.get("belongsToYear"));

    if (!itemId || !itemType) {
      return encodedRedirect("error", "/", "Invalid update request.");
    }

    const validation = extractFormData(formData, itemCreationSchema);

    if (!validation.success) {
      const errorMessage = validation.errors.join(", ");
      return encodedRedirect("error", `/item/update/${itemId}`, errorMessage);
    }

    const validatedData = validation.data;

    const supabase = await createClientForServer();

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
    };

    const { error } = await supabase
      .from("items")
      .update(updatedItem)
      .eq("id", itemId);

    if (error) {
      console.error("Database error updating item:", error);
      return encodedRedirect(
        "error",
        `/item/update/${itemId}`,
        "Unable to update your item. Please try again.",
      );
    }

    return redirect(`/year/${belongsToYear}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Unexpected error in updateItemAction:", error);
    const itemId = formData.get("id")?.toString();
    return encodedRedirect(
      "error",
      itemId ? `/item/update/${itemId}` : "/",
      "Something went wrong. Please try again.",
    );
  }
};
