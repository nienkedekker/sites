import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addMarkdownRoutes,
  MARKDOWN_TYPE,
  needsNegotiation,
  VARY,
  type Route,
} from "../src/lib/markdown-routes.ts";

const adapterRoutes: Route[] = [
  { src: "^/guestbook$", headers: { Location: "/" }, status: 301 },
  { handle: "filesystem" },
  { src: "^/api/wanikani/?$", dest: "_render" },
  { src: "^/.*$", dest: "/404.html", status: 404 },
];

const routes = addMarkdownRoutes(adapterRoutes, ["/", "/now"]);
const filesystem = routes.findIndex((route) => route.handle === "filesystem");
const before = routes.slice(0, filesystem);
const after = routes.slice(filesystem + 1);

// Vercel matches `has` values against the whole header, like Next.js does.
const fullMatch = (pattern: string, value: string) => new RegExp(`^${pattern}$`).test(value);
const matches = (route: Route, path: string) => new RegExp(route.src!).test(path);
const negotiates = (route: Route) => route.dest?.startsWith("/_negotiate?path=");

const browsers = [
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "text/html",
  "*/*",
];

test("browser Accept headers keep pages static", () => {
  for (const accept of browsers) {
    assert.ok(!fullMatch(needsNegotiation.value, accept), accept);
  }
});

test("Accept headers naming neither format keep pages static, so they get the HTML", () => {
  for (const accept of ["application/json", "text/plain", "application/pdf", "image/*", ""]) {
    assert.ok(!fullMatch(needsNegotiation.value, accept), accept);
  }
});

test("Accept headers a static file can't answer go to the negotiate function", () => {
  for (const accept of [
    "text/markdown",
    "Text/Markdown",
    "text/markdown, text/html;q=0.9, */*;q=0.8",
    "text/html, text/markdown;q=0.5",
    "text/html;q=0.5, */*",
    "text/html, */*;q=0",
    "text/html, application/json;q=0.0",
  ]) {
    assert.ok(fullMatch(needsNegotiation.value, accept), accept);
  }
  assert.ok(!fullMatch(needsNegotiation.value, "text/html, */*;q=0.5"));
});

test("pages are negotiated before static files are served", () => {
  const negotiated = before.filter(negotiates);
  assert.equal(negotiated.length, 1);
  const [route] = negotiated;
  assert.deepEqual(route.has, [needsNegotiation]);
  assert.equal(route.missing, undefined);
  for (const path of ["/", "/now", "/now/"]) assert.ok(matches(route, path), path);
  for (const path of ["/nowhere", "/now.md", "/uses"]) assert.ok(!matches(route, path), path);
  assert.equal("/now/".replace(new RegExp(route.src!), route.dest!), "/_negotiate?path=/now/");
});

test("pages vary on Accept and Accept-Encoding whichever version is served", () => {
  const vary = before.find((route) => route.headers?.Vary && route.continue);
  assert.ok(vary);
  assert.equal(vary.headers!.Vary, VARY);
  assert.equal(vary.has, undefined);
  for (const path of ["/", "/now", "/now/"]) assert.ok(matches(vary, path), path);
  assert.ok(!matches(vary, "/uses"));
  assert.ok(before.indexOf(vary) < before.findIndex(negotiates));
});

test(".md files are served as text/markdown", () => {
  const type = before.find((route) => route.continue && route.headers?.["Content-Type"]);
  assert.ok(type && matches(type, "/now.md") && !matches(type, "/now"));
  assert.equal(type.headers!["Content-Type"], MARKDOWN_TYPE);
});

test("unknown paths are negotiated after the filesystem misses, before the HTML 404", () => {
  const [negotiated, html] = routes.slice(-2);
  assert.ok(negotiates(negotiated));
  assert.deepEqual(negotiated.has, [needsNegotiation]);
  assert.equal(
    "/nope".replace(new RegExp(negotiated.src!), negotiated.dest!),
    "/_negotiate?path=/nope"
  );
  assert.deepEqual(html, { src: "^/.*$", dest: "/404.html", status: 404, headers: { Vary: VARY } });
  assert.deepEqual(after[0], { src: "^/api/wanikani/?$", dest: "_render" });
});

test("the adapter's own routes are kept in order", () => {
  assert.deepEqual(routes[0], adapterRoutes[0]);
  assert.deepEqual(
    routes.filter((r) => !negotiates(r) && !r.continue && r.status !== 404),
    adapterRoutes.slice(0, 3)
  );
});

test("throws when the adapter's routes change shape", () => {
  assert.throws(
    () => addMarkdownRoutes([{ src: "^/.*$", dest: "/404.html", status: 404 }], ["/"]),
    /filesystem/
  );
  assert.throws(() => addMarkdownRoutes([{ handle: "filesystem" }], ["/"]), /404/);
});
