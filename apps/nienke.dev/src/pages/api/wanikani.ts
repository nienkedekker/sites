import type { APIRoute } from "astro";
import { WANIKANI_KEY } from "astro:env/server";
import { getProgress } from "../../lib/wanikani";

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
  if (!WANIKANI_KEY) {
    return json({ error: "WaniKani isn't connected" }, 503, false);
  }

  try {
    return json(await getProgress(WANIKANI_KEY, AbortSignal.timeout(8000)));
  } catch (error) {
    console.error("WaniKani error:", error);
    return json({ error: "Couldn't reach WaniKani" }, 502, false);
  }
};
