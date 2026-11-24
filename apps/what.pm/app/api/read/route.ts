import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  idForUpcoming,
  readUpcomingRequest,
  serverError,
} from "@/utils/server/upcoming-book";

// A new release read but not logged: stored as seen, which keeps it out of
// the picks too. The title is the one new releases show, so the page can
// match it on the next visit
export async function POST(request: NextRequest) {
  try {
    const checked = await readUpcomingRequest(request);
    if (!checked.book) return checked.response;
    const { supabase, book } = checked;

    const { found, placeholder } = await idForUpcoming(book);
    const { error } = await supabase.from("dismissed").upsert(
      {
        itemtype: "Book",
        external_id: found?.external_id ?? placeholder,
        title: book.title,
        kind: "seen",
      },
      { onConflict: "itemtype,external_id" },
    );
    if (error) return serverError("marking a new release read", error);

    revalidatePath("/discover/for-you");
    return NextResponse.json({ error: null });
  } catch (error) {
    return serverError("marking a new release read", error);
  }
}
