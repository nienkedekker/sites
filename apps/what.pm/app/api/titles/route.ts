import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClientForServer } from "@/utils/supabase/server";
import { searchTitles } from "@/utils/server/title-search";
import { VALID_ITEM_TYPES } from "@/types/shared";

const paramsSchema = z.object({
  type: z.enum(VALID_ITEM_TYPES),
  q: z.string().trim().min(2).max(200),
});

export async function GET(request: NextRequest) {
  const params = paramsSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!params.success) {
    return NextResponse.json({ error: "Invalid search" }, { status: 400 });
  }

  const supabase = await createClientForServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json([]);

  const results = await searchTitles(params.data.type, params.data.q);
  if (!results) {
    return NextResponse.json({ error: "Source unavailable" }, { status: 502 });
  }
  return NextResponse.json(results);
}
