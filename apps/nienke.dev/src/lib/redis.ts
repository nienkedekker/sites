import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";
import { KV_REST_API_TOKEN, KV_REST_API_URL } from "astro:env/server";

export const redis = new Redis({ url: KV_REST_API_URL, token: KV_REST_API_TOKEN });

const HITS_KEY = "site:hits";
const SEEN_FOR_SECONDS = 60 * 60 * 24;

export function getHits() {
  return redis.get<number>(HITS_KEY).then((hits) => hits ?? 0);
}

// Counts each IP once a day. Only a hash is stored, never the address itself.
export async function incrementHits(ip: string) {
  const visitor = createHash("sha256").update(ip).digest("hex");
  const isNew = await redis.set(`site:seen:${visitor}`, 1, {
    nx: true,
    ex: SEEN_FOR_SECONDS,
  });
  return isNew ? redis.incr(HITS_KEY) : getHits();
}
