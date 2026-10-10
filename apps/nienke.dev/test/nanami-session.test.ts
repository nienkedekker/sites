import { test } from "node:test";
import assert from "node:assert/strict";
import { sameSecret, signSession, verifySession } from "../src/lib/nanami-session.ts";

const now = Date.UTC(2026, 9, 10);

test("a session signed with the password verifies until it expires", () => {
  const session = signSession("hunter2", now);
  assert.ok(verifySession(session, "hunter2", now));
  assert.ok(verifySession(session, "hunter2", now + 29 * 24 * 60 * 60 * 1000));
  assert.ok(!verifySession(session, "hunter2", now + 31 * 24 * 60 * 60 * 1000));
});

test("changing the password signs every session out", () => {
  assert.ok(!verifySession(signSession("hunter2", now), "hunter3", now));
});

test("tampered or malformed sessions don't verify", () => {
  const [expires, signature] = signSession("hunter2", now).split(".");
  const later = Number(expires) + 1000;
  assert.ok(!verifySession(`${later}.${signature}`, "hunter2", now));
  for (const value of [undefined, "", "nonsense", `${expires}.`, `.${signature}`]) {
    assert.ok(!verifySession(value, "hunter2", now));
  }
});

test("sameSecret only matches the exact secret", () => {
  assert.ok(sameSecret("token", "token"));
  assert.ok(!sameSecret("token", "token "));
  assert.ok(!sameSecret("", "token"));
});
