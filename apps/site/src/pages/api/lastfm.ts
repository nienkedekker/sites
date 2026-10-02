// Listening stats for the scrobbles card on the home page. Building them
// takes 15 Last.fm requests, so responses are cached at the edge for an hour.
import type { APIRoute } from "astro";
import { getListeningStats } from "../../lib/lastfm";

export const prerender = false;

const json = (body: unknown, status = 200, cache = true) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...(cache && {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      }),
    },
  });

export const GET: APIRoute = async () => {
  try {
    return json(await getListeningStats(AbortSignal.timeout(8000)));
  } catch (error) {
    console.error("Last.fm error:", error);
    return json({ error: "Couldn't reach Last.fm" }, 502, false);
  }
};
