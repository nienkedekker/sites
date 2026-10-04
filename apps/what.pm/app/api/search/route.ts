import { NextRequest, NextResponse } from "next/server";
import { searchQuerySchema } from "@/utils/schemas/validation";
import { searchItems } from "@/utils/server/item-search";

export async function GET(request: NextRequest) {
  const query = searchQuerySchema.safeParse(
    request.nextUrl.searchParams.get("q") ?? "",
  );
  if (!query.success) {
    return NextResponse.json(
      { error: query.error.issues[0]?.message ?? "Invalid search" },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json({ results: await searchItems(query.data) });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
