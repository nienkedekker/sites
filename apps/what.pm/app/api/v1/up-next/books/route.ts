import { NextResponse } from "next/server";
import { upNextBooks } from "@/utils/server/up-next-lists";

// [{ id, title, author, year }], read by the book fetcher on my media server
export async function GET() {
  try {
    return NextResponse.json(await upNextBooks(), {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    console.error("Failed to read up next books:", error);
    return NextResponse.json(
      { error: "Failed to fetch up next" },
      { status: 500 },
    );
  }
}
