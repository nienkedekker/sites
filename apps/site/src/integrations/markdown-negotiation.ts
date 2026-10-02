import type { AstroIntegration } from "astro";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { addMarkdownRoutes } from "../lib/markdown-routes.ts";

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
