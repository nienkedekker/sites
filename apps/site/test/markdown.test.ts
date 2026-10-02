import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cleanMarkdown,
  renderHome,
  renderLlmsTxt,
  renderNotFound,
  renderPage,
  type HomeContent,
} from "../src/lib/markdown.ts";

const site = "https://example.dev";

const home: HomeContent = {
  site,
  name: "Ada",
  description: "Ada builds things.",
  intro: "I build [things](/now).",
  pages: [{ title: "Now", description: "What I do", href: `${site}/now.md` }],
  email: "ada@example.dev",
  profiles: [{ label: "GitHub", href: "https://github.com/ada" }],
};

test("cleanMarkdown makes root-relative links absolute", () => {
  assert.equal(
    cleanMarkdown("See [/uses](/uses) and [x](<https://a.b/(c)>)", site),
    "See [/uses](https://example.dev/uses) and [x](<https://a.b/(c)>)"
  );
  assert.equal(cleanMarkdown("[x](</a_(b)>)", site), "[x](<https://example.dev/a_(b)>)");
});

test("cleanMarkdown drops decorative images and keeps alt text of bundled ones", () => {
  assert.equal(
    cleanMarkdown('## Work <img src="/k.gif" alt="" width="20" class="kaomoji" />', site),
    "## Work"
  );
  assert.equal(
    cleanMarkdown("![A notebook on a desk](./images/photo.jpg)", site),
    "(Photo: A notebook on a desk)"
  );
  assert.equal(cleanMarkdown("![](../photo.jpg)", site), "");
});

test("renderPage puts title, summary and date before the body", () => {
  assert.equal(
    renderPage({
      title: "Now",
      description: "Up to",
      lastUpdated: new Date("2026-10-01"),
      body: "Body\n",
    }),
    "# Now\n\n> Up to\n\nUpdated 2026-10-01\n\nBody\n"
  );
  assert.equal(renderPage({ title: "T", body: "B" }), "# T\n\nB\n");
});

test("renderHome includes the intro, pages and contact details", () => {
  const md = renderHome(home);
  assert.match(md, /^# Ada\n\n> Ada builds things\.\n/);
  assert.match(md, /I build \[things\]\(https:\/\/example\.dev\/now\)\./);
  assert.match(md, /- \[Now\]\(https:\/\/example\.dev\/now\.md\): What I do/);
  assert.match(md, /- Email: \[ada@example\.dev\]\(mailto:ada@example\.dev\)/);
  assert.match(md, /- \[GitHub\]\(https:\/\/github\.com\/ada\)/);
});

test("renderNotFound explains the error and links to the site index", () => {
  const md = renderNotFound(site);
  assert.match(md, /^# Page not found\n/);
  assert.ok(md.length > 20);
  assert.match(md, /\(https:\/\/example\.dev\/llms\.txt\)/);
  assert.match(md, /\(https:\/\/example\.dev\/sitemap\.xml\)/);
});

test("renderLlmsTxt follows the llms.txt structure", () => {
  const txt = renderLlmsTxt(home, [{ title: "Sitemap", href: `${site}/sitemap.xml` }]);
  const lines = txt.split("\n");

  assert.equal(lines[0], "# Ada");
  assert.equal(lines[2], "> Ada builds things.");
  assert.equal(lines.filter((line) => line.startsWith("# ")).length, 1);
  const notes = txt.slice(txt.indexOf("\n> "), txt.indexOf("\n## "));
  assert.doesNotMatch(notes, /^#/m);
  assert.match(notes, /\*\*When to use this site:\*\*/);
  for (const section of txt.split(/^## .*$/m).slice(1)) {
    for (const line of section.trim().split("\n")) {
      assert.match(line, /^- \[[^\]]+\]\([^)]+\)(: .+)?$/);
    }
  }
  assert.match(txt, /^## Optional$/m);
});
