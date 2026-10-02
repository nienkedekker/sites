import type { APIRoute } from "astro";
import { getHits, incrementHits } from "../../lib/redis";

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// A new visit: count it and return the new total
export const POST: APIRoute = async () => {
  try {
    return json({ count: await incrementHits() });
  } catch (error) {
    console.error("Hit counter error:", error);
    return json({ error: "Failed to update counter" }, 500);
  }
};

// A returning visitor this session: just read the total
export const GET: APIRoute = async () => {
  try {
    return json({ count: await getHits() });
  } catch (error) {
    console.error("Hit counter error:", error);
    return json({ count: 0 });
  }
};
