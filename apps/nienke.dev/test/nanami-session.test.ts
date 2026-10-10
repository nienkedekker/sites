import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addressBucket,
  sameSecret,
  signSession,
  verifySession,
} from "../src/lib/nanami-session.ts";

const now = Date.UTC(2026, 9, 10);
const secret = "a long random session secret";

test("a session verifies until it expires", () => {
  const session = signSession(secret, "hunter2", now);
  assert.ok(verifySession(session, secret, "hunter2", now));
  assert.ok(verifySession(session, secret, "hunter2", now + 29 * 24 * 60 * 60 * 1000));
  assert.ok(!verifySession(session, secret, "hunter2", now + 31 * 24 * 60 * 60 * 1000));
});

test("changing the password or the secret signs every session out", () => {
  const session = signSession(secret, "hunter2", now);
  assert.ok(!verifySession(session, secret, "hunter3", now));
  assert.ok(!verifySession(session, "another secret", "hunter2", now));
});

test("a session can't be checked against a password guess without the secret", () => {
  // The old scheme signed with the password itself; now the password alone isn't enough
  const session = signSession(secret, "hunter2", now);
  assert.ok(!verifySession(session, "hunter2", "hunter2", now));
});

test("tampered or malformed sessions don't verify", () => {
  const [expires, signature] = signSession(secret, "hunter2", now).split(".");
  const later = Number(expires) + 1000;
  assert.ok(!verifySession(`${later}.${signature}`, secret, "hunter2", now));
  for (const value of [undefined, "", "nonsense", `${expires}.`, `.${signature}`]) {
    assert.ok(!verifySession(value, secret, "hunter2", now));
  }
});

test("sameSecret only matches the exact secret", () => {
  assert.ok(sameSecret("token", "token"));
  assert.ok(!sameSecret("token", "token "));
  assert.ok(!sameSecret("", "token"));
});

test("addressBucket groups IPv6 by /64 and leaves IPv4 alone", () => {
  assert.equal(addressBucket("203.0.113.7"), "203.0.113.7");
  assert.equal(addressBucket("::ffff:203.0.113.7"), "203.0.113.7");
  assert.equal(addressBucket("2001:db8:1:2:aaaa:bbbb:cccc:dddd"), "2001:0db8:0001:0002");
  assert.equal(addressBucket("2001:db8:1:2::9"), "2001:0db8:0001:0002");
  assert.equal(addressBucket("2001:DB8::1"), "2001:0db8:0000:0000");
  assert.equal(addressBucket("2001:db8:1:2:ffff::1"), addressBucket("2001:db8:1:2::2"));
});
