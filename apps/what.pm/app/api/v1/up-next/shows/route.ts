import { connection, NextResponse } from "next/server";
import { upNextShows } from "@/utils/server/up-next-lists";

// Sonarr's Custom List: [{ tvdbId, title }]. Built per request, since a TMDB
// lookup that fails during the build would bake in an empty list
export async function GET() {
  await connection();
  try {
    return NextResponse.json(await upNextShows(), {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    console.error("Failed to read up next shows:", error);
    return NextResponse.json(
      { error: "Failed to fetch up next" },
      { status: 500 },
    );
  }
}
