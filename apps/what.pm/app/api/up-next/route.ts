import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
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

// A route, not a Server Action: anything an action revalidates makes the
// router re-render the page and scroll back to the top, mid-list on Discover
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).host !== request.headers.get("host")) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  try {
    const parsed = upcomingSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "That book is missing its details." },
        { status: 400 },
      );
    }
    const { title, author, year } = parsed.data;

    const supabase = await createClientForServer();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      return NextResponse.json(
        { error: "Your session has expired. Sign in again." },
        { status: 401 },
      );
    }

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
      return NextResponse.json(
        { error: "Unable to add that. Please try again." },
        { status: 500 },
      );
    }
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
    console.error("Unexpected error adding an upcoming book:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
