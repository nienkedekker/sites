import { test } from "node:test";
import assert from "node:assert/strict";
import { addMarkdownRoutes, MARKDOWN_TYPE, type Route } from "../src/lib/markdown-routes.ts";

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

const accept = (route: Route) => route.has?.find(({ key }) => key === "accept");
const matches = (route: Route, path: string) => new RegExp(route.src!).test(path);

test("Markdown requests for pages are rewritten before static files are served", () => {
  const rewrites = before.filter(accept);
  assert.deepEqual(
    rewrites.map(({ src, dest }) => [src, dest]),
    [
      ["^/$", "/index.md"],
      ["^/now/?$", "/now.md"],
    ]
  );
  for (const route of rewrites) {
    assert.equal(route.headers?.["Content-Type"], MARKDOWN_TYPE);
    assert.ok(new RegExp(accept(route)!.value!).test("text/markdown"));
    assert.ok(new RegExp(accept(route)!.value!).test("text/markdown, text/html;q=0.9"));
    assert.ok(!new RegExp(accept(route)!.value!).test("text/html,application/xhtml+xml,*/*;q=0.8"));
  }
  assert.ok(matches(rewrites[1], "/now/"));
  assert.ok(!matches(rewrites[0], "/now"));
  assert.ok(!matches(rewrites[1], "/nowhere"));
});

test("pages vary on Accept whichever version is served", () => {
  const vary = before.find((route) => route.headers?.Vary === "Accept" && route.continue);
  assert.ok(vary);
  assert.equal(vary.has, undefined);
  for (const path of ["/", "/now", "/now/"]) assert.ok(matches(vary, path), path);
  assert.ok(!matches(vary, "/uses"));
  assert.ok(before.indexOf(vary) < before.findIndex(accept));
});

test(".md files are served as text/markdown", () => {
  const type = before.find((route) => route.continue && route.headers?.["Content-Type"]);
  assert.ok(type && matches(type, "/now.md") && !matches(type, "/now"));
  assert.equal(type.headers!["Content-Type"], MARKDOWN_TYPE);
});

test("unknown paths get a Markdown 404 for Markdown requests and HTML otherwise", () => {
  const notFound = after.filter((route) => route.status === 404);
  assert.equal(notFound.length, 2);
  assert.deepEqual(
    {
      dest: notFound[0].dest,
      accept: !!accept(notFound[0]),
      type: notFound[0].headers?.["Content-Type"],
    },
    { dest: "/404.md", accept: true, type: MARKDOWN_TYPE }
  );
  assert.equal(notFound[1].dest, "/404.html");
  assert.equal(accept(notFound[1]), undefined);
  for (const route of notFound) assert.equal(route.headers?.Vary, "Accept");
  assert.deepEqual(routes.slice(-2), notFound);
  assert.deepEqual(after[0], { src: "^/api/wanikani/?$", dest: "_render" });
});

test("the adapter's own routes are kept in order", () => {
  assert.deepEqual(routes[0], adapterRoutes[0]);
  assert.deepEqual(
    routes.filter((r) => !accept(r) && !r.continue && r.status !== 404),
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
