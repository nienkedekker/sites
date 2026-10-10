import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { isIPv6 } from "node:net";

export const SESSION_COOKIE = "nanami_session";
export const SESSION_DAYS = 30;

const sha256 = (value: string) => createHash("sha256").update(value).digest();

// Compares digests so neither the length nor the content leaks through timing
export function sameSecret(given: string, expected: string) {
  return timingSafeEqual(sha256(given), sha256(expected));
}

// Signed with its own random secret, so a cookie that gets out says nothing
// about the password. The password's hash is part of what's signed, so
// changing the password still signs every device out
const signature = (expires: number, secret: string, password: string) =>
  createHmac("sha256", secret)
    .update(`nanami:${expires}:${sha256(password).toString("hex")}`)
    .digest("hex");

export function signSession(secret: string, password: string, now = Date.now()) {
  const expires = now + SESSION_DAYS * 24 * 60 * 60 * 1000;
  return `${expires}.${signature(expires, secret, password)}`;
}

export function verifySession(
  value: string | undefined,
  secret: string,
  password: string,
  now = Date.now()
) {
  const [expiresText, given] = value?.split(".") ?? [];
  const expires = Number(expiresText);
  if (!given || !Number.isSafeInteger(expires) || expires <= now) return false;
  return sameSecret(given, signature(expires, secret, password));
}

// Sign-in tries are counted per address, but anyone with IPv6 gets a whole /64
// of them, so those count per /64
export function addressBucket(ip: string) {
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return mapped[1];
  if (!isIPv6(ip)) return ip;
  const [head, tail = ""] = ip.toLowerCase().split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const groups = ip.includes("::")
    ? [...left, ...Array(8 - left.length - right.length).fill("0"), ...right]
    : left;
  return groups
    .slice(0, 4)
    .map((group) => group.padStart(4, "0"))
    .join(":");
}
