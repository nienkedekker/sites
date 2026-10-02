import type { AstroIntegration } from "astro";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { addMarkdownRoutes } from "../lib/markdown-routes.ts";

// Adds Markdown content negotiation to the Vercel routing config. Astro runs
// the adapter's build hooks first, so its config.json exists by the time this
// runs. Every Markdown file the build emits next to the pages (index.md,
// now.md, ...) becomes the text/markdown version of that page.
export default function markdownNegotiation(): AstroIntegration {
  let root: URL;

  return {
    name: "markdown-negotiation",
    hooks: {
      "astro:config:done": ({ config }) => {
        root = config.root;
      },
      "astro:build:done": async ({ dir, logger }) => {
        const configFile = new URL(".vercel/output/config.json", root);

        // `dir` holds the built static files; the adapter copies them to
        // .vercel/output/static only after this hook
        const pagePaths = (await readdir(dir))
          .filter((file) => file.endsWith(".md") && file !== "404.md")
          .map((file) => file.slice(0, -".md".length))
          .map((name) => (name === "index" ? "/" : `/${name}`));

        const config = JSON.parse(await readFile(configFile, "utf-8"));
        config.routes = addMarkdownRoutes(config.routes, pagePaths);
        await writeFile(configFile, JSON.stringify(config, null, "\t"));

        logger.info(`Markdown versions routed for ${pagePaths.join(", ")}`);
      },
    },
  };
}
