"use server";

import { encodedRedirect } from "@/utils";
import { createClientForServer } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Item, ItemInsert, ItemUpdate } from "@/types";

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClientForServer();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/");
};

export const signOutAction = async () => {
  const supabase = await createClientForServer();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const createItemAction = async (formData: FormData) => {
  const itemType = formData.get("itemtype")?.toString();

  if (!itemType) {
    return encodedRedirect("error", "/create", "Item type is required");
  }

  const supabase = await createClientForServer();
  const title = formData.get("title") as string;
  const publishedYear = Number(formData.get("publishedYear"));
  const redo = formData.get("redo") === "on";
  const currentYear = new Date().getFullYear();

  const newItem: ItemInsert = {
    title,
    itemtype: itemType,
    belongs_to_year: currentYear,
    published_year: publishedYear,
    redo,
  };

  if (itemType === "Book") {
    newItem.author = formData.get("author") as string;
  } else if (itemType === "Movie") {
    newItem.director = formData.get("director") as string;
  } else if (itemType === "Show") {
    newItem.season = Number(formData.get("season")) || null;
  }

  const { error } = await supabase.from("items").insert(newItem);

  if (error) {
    return encodedRedirect("error", "/create", error.message);
  }

  return redirect(`/year/${currentYear}`);
};

export const deleteItemAction = async (formData: FormData) => {
  const supabase = await createClientForServer();
  const itemId = formData.get("id")?.toString();
  const belongsToYear = Number(formData.get("belongsToYear"));

  if (!itemId) {
    return encodedRedirect("error", "/", "Item ID is required for deletion.");
  }

  const { error } = await supabase.from("items").delete().eq("id", itemId);

  if (error) {
    return encodedRedirect("error", "/", error.message);
  }

  return redirect(`/year/${belongsToYear}`);
};

export const updateItemAction = async (formData: FormData) => {
  const supabase = await createClientForServer();
  const itemId = formData.get("id")?.toString();
  const itemType = formData.get("itemtype")?.toString();
  const belongsToYear = Number(formData.get("belongsToYear")); // Get the manually set year

  if (!itemId || !itemType) {
    return encodedRedirect("error", "/", "Invalid update request.");
  }

  const updatedItem: ItemUpdate = {
    title: formData.get("title") as string,
    published_year: Number(formData.get("publishedYear")),
    belongs_to_year: belongsToYear,
    redo: formData.get("redo") === "on",
  };

  if (itemType === "Book") {
    updatedItem.author = formData.get("author") as string;
  } else if (itemType === "Movie") {
    updatedItem.director = formData.get("director") as string;
  } else if (itemType === "Show") {
    updatedItem.season = Number(formData.get("season")) || null;
  }

  const { error } = await supabase
    .from("items")
    .update(updatedItem)
    .eq("id", itemId);

  if (error) {
    return encodedRedirect("error", `/item/update/${itemId}`, error.message);
  }

  return redirect(`/year/${belongsToYear}`);
};

export type SearchState = {
  query: string;
  results: Item[];
  initial: boolean;
};
export async function searchItems(
  prevState: SearchState,
  formData: FormData,
): Promise<SearchState> {
  const query = formData.get("query") as string;

  if (!query) return { query: "", results: [], initial: false };

  // Trim and validate query length
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2) {
    return { query, results: [], initial: false };
  }

  const supabase = await createClientForServer();

  // Escape special characters for ILIKE pattern matching
  const escapedQuery = trimmedQuery.replace(/[%_]/g, '\\$&');

  const { data, error } = await supabase
    .from("items")
    .select("id, title, author, director, itemtype, season, published_year, belongs_to_year, redo") // Select only needed columns
    .or(
      `title.ilike.%${escapedQuery}%,author.ilike.%${escapedQuery}%,director.ilike.%${escapedQuery}%`,
    )
    .order("created_at", { ascending: false })
    .limit(100); // Limit results to prevent excessive data transfer

  if (error) {
    console.error("Search error:", error);
    return { query, results: [], initial: false };
  }

  return {
    query,
    results: data as Item[],
    initial: false,
  };
}
