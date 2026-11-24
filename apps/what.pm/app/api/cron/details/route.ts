import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { ITEMS_TAG, WANTED_TAG } from "@/utils/constants/app";
import { fillMissingDetails } from "@/utils/server/fill-details";
import { createAdminClient } from "@/utils/supabase/admin";

export const maxDuration = 300;

// Stops starting lookups well before maxDuration; whatever is left waits for
// the next run
const BUDGET_MS = 240_000;
const LIMIT = 50;

export async function GET(request: NextRequest) {
  const started = Date.now();
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ skipped: "no service role key" });
    }

    const summary = await fillMissingDetails(supabase, {
      limit: LIMIT,
      deadline: started + BUDGET_MS,
    });
    if (summary.linked.length || summary.filled.length) {
      revalidateTag(ITEMS_TAG, "max");
    }
    if (summary.relinked.length) revalidateTag(WANTED_TAG, "max");

    console.log("Cron details:", JSON.stringify(summary));
    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    unstable_rethrow(error);
    console.error("Cron details error:", error);
    return NextResponse.json(
      {
        error: "Filling details failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
