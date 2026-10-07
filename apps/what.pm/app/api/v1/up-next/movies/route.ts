import { NextResponse } from "next/server";
import { upNextMovies } from "@/utils/server/up-next-lists";

// Radarr's Custom List: [{ id: <TMDB id> }]
export async function GET() {
  try {
    return NextResponse.json(await upNextMovies(), {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    console.error("Failed to read up next movies:", error);
    return NextResponse.json(
      { error: "Failed to fetch up next" },
      { status: 500 },
    );
  }
}
