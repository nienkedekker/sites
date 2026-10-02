import { test } from "node:test";
import assert from "node:assert/strict";
import { renderSitemap } from "../src/lib/sitemap.ts";

test("renderSitemap lists every URL, with lastmod when known", () => {
  const xml = renderSitemap([
    { loc: "https://example.dev/" },
    { loc: "https://example.dev/now", lastmod: new Date("2026-10-01T12:00:00Z") },
  ]);

  assert.match(
    xml,
    /^<\?xml version="1\.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/
  );
  assert.match(xml, /<url>\n {4}<loc>https:\/\/example\.dev\/<\/loc>\n {2}<\/url>/);
  assert.match(xml, /<loc>https:\/\/example\.dev\/now<\/loc>\n {4}<lastmod>2026-10-01<\/lastmod>/);
  assert.equal(xml.match(/<url>/g)?.length, 2);
});

test("renderSitemap escapes XML in URLs", () => {
  assert.match(
    renderSitemap([{ loc: "https://example.dev/?a=1&b=2" }]),
    /<loc>https:\/\/example\.dev\/\?a=1&amp;b=2<\/loc>/
  );
});
