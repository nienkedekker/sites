import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { Redis } from "@upstash/redis";
import type { Report, StoredReport } from "@/utils/data/nanami";
import { createClientForServer } from "@/utils/supabase/server";

// A dev server keeps its own report, so trying things out locally never
// changes what the live page shows
const REPORT_KEY =
  process.env.NODE_ENV === "production" ? "nanami:report" : "nanami:report:dev";

let client: Redis | undefined;

// Made on first use, so a log without nanami never needs the keys
const redis = () =>
  (client ??= new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  }));

const sha256 = (value: string) => createHash("sha256").update(value).digest();

// Compares digests so neither the length nor the content leaks through timing
export function sameSecret(given: string, expected: string) {
  return timingSafeEqual(sha256(given), sha256(expected));
}

// Without a token set, nothing gets to push
export function isNanami(authorization: string | null) {
  const token = process.env.NANAMI_PUSH_TOKEN;
  return !!token && sameSecret(authorization ?? "", `Bearer ${token}`);
}

// The report says what runs at home, so being signed in isn't enough: it's
// for the owner only, the same check the database's policies make
export async function isOwner() {
  const supabase = await createClientForServer();
  const { data } = await supabase.rpc("is_owner");
  return data === true;
}

export const getReport = () => redis().get<StoredReport>(REPORT_KEY);

export const saveReport = (report: Report) =>
  redis().set<StoredReport>(REPORT_KEY, { ...report, receivedAt: Date.now() });

// For a page's first render: the report, or null when there's none or it can't
// be read, and the time it was read, which its age is counted from
export async function loadReport() {
  const report = await getReport().catch(() => null);
  return { report, renderedAt: Date.now() };
}
