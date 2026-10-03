import { test } from "node:test";
import assert from "node:assert/strict";
import { HTML, MARKDOWN, negotiate, preferredType } from "../src/lib/negotiation.ts";

const both = [HTML, MARKDOWN];
const chrome =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8";

test("preferredType passes the acceptmarkdown.com test vectors", () => {
  assert.equal(preferredType("text/markdown", both), MARKDOWN);
  assert.equal(preferredType("text/markdown, text/html;q=0.8", both), MARKDOWN);
  assert.equal(preferredType("text/html", both), HTML);
  assert.equal(preferredType("text/markdown;q=0, text/html", both), HTML);
  assert.equal(preferredType("text/markdown;q=0", [MARKDOWN]), null);
  assert.equal(preferredType(null, both), HTML);
  assert.equal(preferredType("*/*", both), HTML);
});

test("preferredType ranks by q-value, then specificity, then client order", () => {
  assert.equal(preferredType("text/html;q=1, text/markdown;q=0.9", both), HTML);
  assert.equal(preferredType("text/html;q=0.5, text/markdown;q=0.9", both), MARKDOWN);
  assert.equal(preferredType("text/html, text/markdown", both), HTML);
  assert.equal(preferredType("text/markdown, text/html", both), MARKDOWN);
  assert.equal(preferredType("text/markdown, text/html;q=0.9, */*;q=0.8", both), MARKDOWN);
  assert.equal(preferredType("text/html;q=0, */*", both), MARKDOWN);
  assert.equal(preferredType("text/*;q=0.5, text/markdown;q=0", both), HTML);
  assert.equal(preferredType(chrome, both), HTML);
  assert.equal(preferredType("TEXT/Markdown", both), MARKDOWN);
  assert.equal(preferredType("text/markdown;charset=utf-8;q=0.7, text/html;q=0.6", both), MARKDOWN);
});

test("preferredType serves the default for empty or exclusion-only headers", () => {
  assert.equal(preferredType("", both), HTML);
  assert.equal(preferredType("text/markdown;q=0", both), HTML);
  assert.equal(preferredType("text/html;q=0", both), MARKDOWN);
  assert.equal(preferredType("text/html;q=0, text/markdown;q=0.0", both), null);
});

test("preferredType returns null when nothing it produces is acceptable", () => {
  assert.equal(preferredType("application/pdf", both), null);
  assert.equal(preferredType("application/json, image/*", both), null);
});

const files: Record<string, string> = {
  "/now": "<h1>Now</h1>",
  "/now.md": "# Now\n",
  "/": "<h1>Home</h1>",
  "/index.md": "# Home\n",
  "/404.html": "<h1>Lost</h1>",
  "/404.md": "# Page not found\n",
};

const requested: { path: string; accept: string | null; method?: string }[] = [];
const fakeFetch = (async (input: URL, init?: RequestInit) => {
  const path = new URL(input).pathname;
  requested.push({ path, accept: new Headers(init?.headers).get("accept"), method: init?.method });
  const body = files[path];
  return body === undefined
    ? new Response("missing", { status: 404 })
    : new Response(body, {
        headers: {
          "Content-Type": path.endsWith(".md") ? "text/plain" : "text/html; charset=utf-8",
        },
      });
}) as typeof fetch;

const call = (path: string, accept?: string, method = "GET") =>
  negotiate(
    new Request(`https://nienke.dev${path}`, {
      method,
      headers: accept === undefined ? {} : { accept },
    }),
    ["/", "/now"],
    fakeFetch
  );

test("negotiate serves Markdown with Vary and Content-Location when it is preferred", async () => {
  const response = await call("/now/", "text/markdown, text/html;q=0.9");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/markdown; charset=utf-8");
  assert.equal(response.headers.get("vary"), "Accept, Accept-Encoding");
  assert.equal(response.headers.get("content-location"), "/now.md");
  assert.equal(await response.text(), "# Now\n");
  assert.deepEqual(requested.at(-1), { path: "/now.md", accept: "text/html", method: "GET" });
});

test("negotiate serves the static HTML when HTML wins", async () => {
  const response = await call("/", "text/markdown;q=0, text/html");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
  assert.equal(response.headers.get("vary"), "Accept, Accept-Encoding");
  assert.equal(response.headers.get("content-location"), null);
  assert.equal(await response.text(), "<h1>Home</h1>");
  assert.deepEqual(requested.at(-1), { path: "/", accept: "text/html", method: "GET" });
});

test("negotiate reads the page from the path query the route passes", async () => {
  const response = await negotiate(
    new Request("https://nienke.dev/_negotiate?path=/now", {
      headers: { accept: "text/markdown" },
    }),
    ["/now"],
    fakeFetch
  );
  assert.equal(await response.text(), "# Now\n");
});

test("negotiate falls back to HTML instead of a 406 when nothing fits", async () => {
  for (const accept of [
    "application/pdf",
    "application/json",
    "text/plain",
    "text/html;q=0, text/markdown;q=0",
  ]) {
    const response = await call("/now", accept);
    assert.equal(response.status, 200, accept);
    assert.equal(response.headers.get("content-type"), "text/html; charset=utf-8", accept);
    assert.equal(response.headers.get("vary"), "Accept, Accept-Encoding", accept);
    assert.equal(response.headers.get("content-location"), null, accept);
    assert.equal(await response.text(), "<h1>Now</h1>", accept);
  }
});

test("negotiate keeps the 404 status for unknown paths, in either format", async () => {
  const markdown = await call("/nope", "text/markdown");
  assert.equal(markdown.status, 404);
  assert.equal(markdown.headers.get("content-type"), "text/markdown; charset=utf-8");
  assert.equal(await markdown.text(), "# Page not found\n");

  const html = await call("/nope", "text/markdown;q=0, text/html");
  assert.equal(html.status, 404);
  assert.equal(await html.text(), "<h1>Lost</h1>");

  const pdf = await call("/nope", "application/pdf");
  assert.equal(pdf.status, 404);
  assert.equal(await pdf.text(), "<h1>Lost</h1>");
});

test("negotiate forwards HEAD requests as HEAD", async () => {
  const response = await call("/now", "text/markdown", "HEAD");
  assert.equal(response.status, 200);
  assert.equal(requested.at(-1)?.method, "HEAD");
});
