import type { AstroCookies } from "astro";
import { createHash } from "node:crypto";
import { NANAMI_PASSWORD, NANAMI_PUSH_TOKEN, NANAMI_SESSION_SECRET } from "astro:env/server";
import type { Report, StoredReport } from "./nanami-report";
import {
  SESSION_COOKIE,
  SESSION_DAYS,
  addressBucket,
  sameSecret,
  signSession,
  verifySession,
} from "./nanami-session";
import { redis } from "./redis";

const REPORT_KEY = "nanami:report";
// Ten tries per address (or IPv6 /64) every fifteen minutes, and fifty wrong
// passwords an hour from everywhere together, so many addresses don't add up
// to many guesses
const LOGIN_TRIES = 10;
const LOGIN_WINDOW_SECONDS = 15 * 60;
const FAILURES_KEY = "nanami:login:failures";
const MAX_FAILURES = 50;
const FAILURES_WINDOW_SECONDS = 60 * 60;

// Without a password and a session secret set, nobody gets in
export const isSignedIn = (cookies: AstroCookies) =>
  !!NANAMI_PASSWORD &&
  !!NANAMI_SESSION_SECRET &&
  verifySession(cookies.get(SESSION_COOKIE)?.value, NANAMI_SESSION_SECRET, NANAMI_PASSWORD);

export const isNanami = (authorization: string | null) =>
  !!NANAMI_PUSH_TOKEN && sameSecret(authorization ?? "", `Bearer ${NANAMI_PUSH_TOKEN}`);

export type SignIn = "signed-in" | "wrong" | "slow-down" | "locked";

// Counts in one go, so a counter can't be left without its expiry and lock an address out for good
const count = async (key: string, seconds: number) => {
  const [value] = await redis.multi().incr(key).expire(key, seconds, "NX").exec<[number, number]>();
  return value;
};

// Only a hash of the address is stored
export async function signIn(password: string, ip: string, cookies: AstroCookies): Promise<SignIn> {
  if (!NANAMI_PASSWORD || !NANAMI_SESSION_SECRET) return "locked";
  const key = `nanami:login:${createHash("sha256").update(addressBucket(ip)).digest("hex")}`;
  const tries = await count(key, LOGIN_WINDOW_SECONDS);
  const failures = (await redis.get<number>(FAILURES_KEY)) ?? 0;
  if (tries > LOGIN_TRIES || failures >= MAX_FAILURES) return "slow-down";
  if (!sameSecret(password, NANAMI_PASSWORD)) {
    await count(FAILURES_KEY, FAILURES_WINDOW_SECONDS);
    return "wrong";
  }

  await redis.del(key);
  cookies.set(SESSION_COOKIE, signSession(NANAMI_SESSION_SECRET, NANAMI_PASSWORD), {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return "signed-in";
}

export const signOut = (cookies: AstroCookies) => cookies.delete(SESSION_COOKIE, { path: "/" });

export const getReport = () => redis.get<StoredReport>(REPORT_KEY);

export const saveReport = (report: Report) =>
  redis.set<StoredReport>(REPORT_KEY, { ...report, receivedAt: Date.now() });
