import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "nanami_session";
export const SESSION_DAYS = 30;

// Compares digests so neither the length nor the content leaks through timing
export function sameSecret(given: string, expected: string) {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(given), digest(expected));
}

const signature = (expires: number, secret: string) =>
  createHmac("sha256", secret).update(`nanami:${expires}`).digest("hex");

// A session is its expiry plus a signature made with my password, so changing
// the password signs every device out and nothing has to be stored
export function signSession(secret: string, now = Date.now()) {
  const expires = now + SESSION_DAYS * 24 * 60 * 60 * 1000;
  return `${expires}.${signature(expires, secret)}`;
}

export function verifySession(value: string | undefined, secret: string, now = Date.now()) {
  const [expiresText, given] = value?.split(".") ?? [];
  const expires = Number(expiresText);
  if (!given || !Number.isSafeInteger(expires) || expires <= now) return false;
  return sameSecret(given, signature(expires, secret));
}
