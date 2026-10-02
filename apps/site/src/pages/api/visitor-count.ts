import type { APIRoute } from "astro";
import { getHits, incrementHits } from "../../lib/redis";

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const POST: APIRoute = async () => {
  try {
    return json({ count: await incrementHits() });
  } catch (error) {
    console.error("Hit counter error:", error);
    return json({ error: "Failed to update counter" }, 500);
  }
};

export const GET: APIRoute = async () => {
  try {
    return json({ count: await getHits() });
  } catch (error) {
    console.error("Hit counter error:", error);
    return json({ count: 0 });
  }
};
