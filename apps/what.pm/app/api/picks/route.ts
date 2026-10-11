import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { CANCELLED, pickAgain } from "@/utils/server/pick-again";
import { hasRecs } from "@/utils/server/services";
import { createClientForServer } from "@/utils/supabase/server";

// Claude and looking up its picks take a while
export const maxDuration = 300;

// Picking again runs here rather than as a server action, so closing the
// request (Cancel on the page) stops it: request.signal goes on to Claude
export async function POST(request: NextRequest) {
  // Only from the site itself, since a run costs a Claude call
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).host !== request.headers.get("host")) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  try {
    const supabase = await createClientForServer();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return NextResponse.json(
        { error: "Your session has expired. Sign in again." },
        { status: 401 },
      );
    }
    if (!hasRecs()) {
      return NextResponse.json(
        { error: "Picks need an ANTHROPIC_API_KEY." },
        { status: 503 },
      );
    }

    const { error } = await pickAgain(supabase, request.signal);
    if (error === CANCELLED) {
      console.info("Picking again was cancelled");
      return NextResponse.json({ error }, { status: 499 });
    }
    if (error) return NextResponse.json({ error }, { status: 502 });

    revalidatePath("/discover/for-you");
    return NextResponse.json({ error: null });
  } catch (error) {
    console.error("Unexpected error picking again:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
