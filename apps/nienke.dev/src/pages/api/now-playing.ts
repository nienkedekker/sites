import type { APIRoute } from "astro";
import { getLatestTrack } from "../../lib/lastfm";

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    return new Response(JSON.stringify(await getLatestTrack(AbortSignal.timeout(5000))), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=15",
      },
    });
  } catch (error) {
    console.error("Last.fm error:", error);
    return new Response(JSON.stringify({ error: "Couldn't reach Last.fm" }), {
      status: 502,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
};
