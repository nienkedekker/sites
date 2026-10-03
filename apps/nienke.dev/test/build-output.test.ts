import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const output = new URL("../.vercel/output/", import.meta.url);
const read = (path: string) => readFileSync(new URL(`static/${path}`, output), "utf-8");
const exists = (path: string) => existsSync(new URL(`static/${path}`, output));
const site = "https://nienke.dev";

const pages = ["/", "/now", "/uses", "/links", "/colophon"];
const htmlFile = (path: string) => (path === "/" ? "index.html" : `${path.slice(1)}/index.html`);
const markdownFile = (path: string) => (path === "/" ? "index.md" : `${path.slice(1)}.md`);
const sitePath = (url: string) => url.replace(site, "").replace(/^\/$/, "/");

test("the build output exists", () => {
  assert.ok(existsSync(new URL("config.json", output)), "run `astro build` first");
});

test("every page has a Markdown version that it links to", () => {
  for (const path of pages) {
    const markdown = read(markdownFile(path));
    assert.match(markdown, /^# .+\n/, path);
    assert.ok(markdown.trim().length > 100, path);
    assert.doesNotMatch(markdown, /\]\(\/[^/]/, `${path} has relative links`);
    assert.match(
      read(htmlFile(path)),
      new RegExp(`<link rel="alternate" type="text/markdown" href="/${markdownFile(path)}">`),
      path
    );
  }
});

test("the routing config sends Markdown requests to files that exist", () => {
  const { routes } = JSON.parse(readFileSync(new URL("config.json", output), "utf-8"));
  const markdownRoutes = routes.filter((route: { has?: { key: string }[] }) =>
    route.has?.some(({ key }) => key === "accept")
  );
  assert.deepEqual(
    markdownRoutes.map(({ dest }: { dest: string }) => dest).sort(),
    [...pages.map((path) => `/${markdownFile(path)}`), "/404.md"].sort()
  );
  for (const { dest } of markdownRoutes) assert.ok(exists(dest.slice(1)), dest);
});

test("the Markdown 404 explains the error and points to the site index", () => {
  const markdown = read("404.md");
  assert.match(markdown, /^# Page not found\n/);
  assert.ok(markdown.length >= 20);
  assert.match(markdown, /\(https:\/\/nienke\.dev\/llms\.txt\)/);
  assert.match(markdown, /\(https:\/\/nienke\.dev\/sitemap\.xml\)/);
});

test("the home page has Person JSON-LD", () => {
  const html = read("index.html");
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
  assert.equal(scripts.length, 1);
  const person = JSON.parse(scripts[0][1]);
  assert.equal(person["@context"], "https://schema.org");
  assert.equal(person["@type"], "Person");
  assert.equal(person.name, "Nienke Dekker");
  assert.equal(person.url, `${site}/`);
  assert.ok(person.description);
  assert.ok(person.sameAs.length > 0);
  assert.equal(person.address["@type"], "PostalAddress");
});

test("pages have canonical, lang, og:type and og:image metadata", () => {
  for (const path of pages) {
    const html = read(htmlFile(path));
    assert.match(html, /<html lang="en"/, path);
    assert.match(html, /<link rel="canonical" href="https:\/\/nienke\.dev\//, path);
    assert.match(html, /<meta property="og:type" content="website">/, path);
    const image = html.match(/<meta property="og:image" content="([^"]+)">/)?.[1];
    assert.ok(image?.startsWith(`${site}/`), path);
    assert.ok(exists(sitePath(image).slice(1)), image);
  }
  assert.equal(read("index.html").match(/<h1[\s>]/g)?.length, 1);
});

test("the sitemap lists every page and robots.txt points to it", () => {
  const xml = read("sitemap.xml");
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, loc]) => loc);
  assert.deepEqual(locs.map(sitePath).sort(), [...pages].sort());
  for (const loc of locs) assert.ok(exists(htmlFile(sitePath(loc))), loc);
  for (const [, date] of xml.matchAll(/<lastmod>(.*?)<\/lastmod>/g)) {
    assert.match(date, /^\d{4}-\d{2}-\d{2}$/);
  }
  assert.match(read("robots.txt"), /^Sitemap: https:\/\/nienke\.dev\/sitemap\.xml$/m);
});

test("llms.txt has when-to-use guidance and links to files that exist", () => {
  const txt = read("llms.txt");
  assert.match(txt, /^# Nienke Dekker\n\n> /);
  assert.match(txt, /\*\*When to use this site:\*\*/);
  const links = [...txt.matchAll(/\]\((https:\/\/nienke\.dev\/[^)]+)\)/g)].map(([, href]) => href);
  assert.ok(links.length >= pages.length);
  for (const href of links) assert.ok(exists(sitePath(href).slice(1)), href);
});
