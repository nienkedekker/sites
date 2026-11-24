import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { WANTED_TAG } from "@/utils/constants/app";
import {
  idForUpcoming,
  readUpcomingRequest,
  serverError,
} from "@/utils/server/upcoming-book";

export async function POST(request: NextRequest) {
  try {
    const checked = await readUpcomingRequest(request);
    if (!checked.book) return checked.response;
    const { supabase, book } = checked;

    const { found, placeholder } = await idForUpcoming(book);
    const { error } = await supabase.from("wanted").upsert(
      {
        itemtype: "Book",
        external_id: found?.external_id ?? placeholder,
        title: found?.title ?? book.title,
        creator: book.author || found?.creator || null,
        published_year: book.year,
      },
      { onConflict: "itemtype,external_id" },
    );
    if (error) return serverError("adding an upcoming book", error);
    if (found) {
      await supabase
        .from("wanted")
        .delete()
        .match({ itemtype: "Book", external_id: placeholder });
    }

    revalidateTag(WANTED_TAG, { expire: 0 });
    revalidatePath("/discover/for-you");
    return NextResponse.json({ error: null });
  } catch (error) {
    return serverError("adding an upcoming book", error);
  }
}
