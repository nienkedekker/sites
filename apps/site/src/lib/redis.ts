// Upstash Redis: the only runtime data on the site, the visitor counter.
import { Redis } from "@upstash/redis";
import { KV_REST_API_TOKEN, KV_REST_API_URL } from "astro:env/server";

const redis = new Redis({ url: KV_REST_API_URL, token: KV_REST_API_TOKEN });

const HITS_KEY = "site:hits";

export function getHits() {
  return redis.get<number>(HITS_KEY).then((hits) => hits ?? 0);
}

export function incrementHits() {
  return redis.incr(HITS_KEY);
}
