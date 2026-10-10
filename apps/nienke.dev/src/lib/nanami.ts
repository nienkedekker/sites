import type { AstroCookies } from "astro";
import { createHash } from "node:crypto";
import { NANAMI_PASSWORD, NANAMI_PUSH_TOKEN } from "astro:env/server";
import type { Report, StoredReport } from "./nanami-report";
import {
  SESSION_COOKIE,
  SESSION_DAYS,
  sameSecret,
  signSession,
  verifySession,
} from "./nanami-session";
import { redis } from "./redis";

const REPORT_KEY = "nanami:report";
const LOGIN_TRIES = 10;
const LOGIN_WINDOW_SECONDS = 15 * 60;

// Without a password set, nobody gets in
export const isSignedIn = (cookies: AstroCookies) =>
  !!NANAMI_PASSWORD && verifySession(cookies.get(SESSION_COOKIE)?.value, NANAMI_PASSWORD);

export const isNanami = (authorization: string | null) =>
  !!NANAMI_PUSH_TOKEN && sameSecret(authorization ?? "", `Bearer ${NANAMI_PUSH_TOKEN}`);

export type SignIn = "signed-in" | "wrong" | "slow-down" | "locked";

// Ten tries per IP every fifteen minutes. Only a hash of the address is stored
export async function signIn(password: string, ip: string, cookies: AstroCookies): Promise<SignIn> {
  if (!NANAMI_PASSWORD) return "locked";
  const key = `nanami:login:${createHash("sha256").update(ip).digest("hex")}`;
  const tries = await redis.incr(key);
  if (tries === 1) await redis.expire(key, LOGIN_WINDOW_SECONDS);
  if (tries > LOGIN_TRIES) return "slow-down";
  if (!sameSecret(password, NANAMI_PASSWORD)) return "wrong";

  await redis.del(key);
  cookies.set(SESSION_COOKIE, signSession(NANAMI_PASSWORD), {
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
