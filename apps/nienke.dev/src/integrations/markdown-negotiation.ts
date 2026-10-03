import type { AstroIntegration } from "astro";
import { build } from "esbuild";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { addMarkdownRoutes, NEGOTIATE_FUNCTION } from "../lib/markdown-routes.ts";

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
        const functionDir = new URL(`.vercel/output/functions/${NEGOTIATE_FUNCTION}.func/`, root);

        const pagePaths = (await readdir(dir))
          .filter((file) => file.endsWith(".md") && file !== "404.md")
          .map((file) => file.slice(0, -".md".length))
          .map((name) => (name === "index" ? "/" : `/${name}`));

        const config = JSON.parse(await readFile(configFile, "utf-8"));
        config.routes = addMarkdownRoutes(config.routes, pagePaths);
        await writeFile(configFile, JSON.stringify(config, null, "\t"));

        await mkdir(functionDir, { recursive: true });
        await build({
          stdin: {
            contents: `import { negotiate } from "./src/lib/negotiation.ts";
const pages = ${JSON.stringify(pagePaths)};
export default (request) => negotiate(request, pages);`,
            resolveDir: fileURLToPath(root),
            loader: "ts",
          },
          bundle: true,
          format: "esm",
          platform: "neutral",
          target: "es2022",
          outfile: fileURLToPath(new URL("index.js", functionDir)),
          logLevel: "warning",
        });
        await writeFile(
          new URL(".vc-config.json", functionDir),
          JSON.stringify({ runtime: "edge", entrypoint: "index.js" }, null, "\t")
        );

        logger.info(`Markdown versions negotiated for ${pagePaths.join(", ")}`);
      },
    },
  };
}
