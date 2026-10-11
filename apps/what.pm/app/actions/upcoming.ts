"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { WANTED_TAG } from "@/utils/constants/app";
import { unmatchedId } from "@/utils/data/external-ids";
import { lookUp } from "@/utils/server/recommend-lookup";
import { createClientForServer } from "@/utils/supabase/server";

const upcomingSchema = z.object({
  title: z.string().trim().min(1).max(300),
  author: z.string().trim().max(200),
  year: z.coerce.number().int().min(1000).max(3000),
});

export async function addUpcomingToUpNext(
  formData: FormData,
): Promise<{ error: string | null }> {
  try {
    const parsed = upcomingSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "That book is missing its details." };
    const { title, author, year } = parsed.data;

    const supabase = await createClientForServer();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user)
      return { error: "Your session has expired. Sign in again." };

    const [{ found }] = await lookUp([
      {
        itemtype: "Book",
        title,
        creator: author,
        year,
        reason: "",
        because: [],
      },
    ]);
    const placeholder = unmatchedId(title, author);
    const { error } = await supabase.from("wanted").upsert(
      {
        itemtype: "Book",
        external_id: found?.external_id ?? placeholder,
        title: found?.title ?? title,
        creator: author || found?.creator || null,
        published_year: year,
      },
      { onConflict: "itemtype,external_id" },
    );
    if (error) {
      console.error("Database error adding an upcoming book:", error);
      return { error: "Unable to add that. Please try again." };
    }
    if (found) {
      await supabase
        .from("wanted")
        .delete()
        .match({ itemtype: "Book", external_id: placeholder });
    }

    updateTag(WANTED_TAG);
    revalidatePath("/discover/for-you");
    revalidatePath("/discover");
    return { error: null };
  } catch (error) {
    console.error("Unexpected error in addUpcomingToUpNext:", error);
    return { error: "Something went wrong. Please try again." };
  }
}
