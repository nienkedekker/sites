import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClientForServer } from "@/utils/supabase/server";
import { getSeasonYears } from "@/utils/server/title-search";

const paramsSchema = z.object({
  id: z.string().regex(/^\d{1,12}$/),
});

export async function GET(request: NextRequest) {
  const params = paramsSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!params.success) {
    return NextResponse.json({ error: "Invalid show id" }, { status: 400 });
  }

  const supabase = await createClientForServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({});

  return NextResponse.json(await getSeasonYears(params.data.id));
}
