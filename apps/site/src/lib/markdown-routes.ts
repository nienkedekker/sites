// Markdown content negotiation for the static pages, as Vercel Build Output API
// routes (https://vercel.com/docs/build-output-api/configuration#routes).
// A request with `Accept: text/markdown` is rewritten to the page's Markdown
// twin (/now -> /now.md, / -> /index.md); everything else keeps getting HTML.

export interface Route {
  src?: string;
  dest?: string;
  headers?: Record<string, string>;
  status?: number;
  continue?: boolean;
  handle?: string;
  has?: { type: string; key: string; value?: string }[];
}

export const MARKDOWN_TYPE = "text/markdown; charset=utf-8";

const acceptsMarkdown = [{ type: "header", key: "accept", value: ".*text/markdown.*" }];

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// "/" or "/now", matched with or without a trailing slash
const pathPattern = (path: string) => (path === "/" ? "^/$" : `^${escapeRegex(path)}/?$`);

export const markdownFile = (path: string) => (path === "/" ? "/index.md" : `${path}.md`);

export function addMarkdownRoutes(routes: Route[], pagePaths: string[]): Route[] {
  const filesystem = routes.findIndex((route) => route.handle === "filesystem");
  if (filesystem === -1) throw new Error("No filesystem phase in the routes");

  // The adapter sends every unmatched path to the static 404 page
  const notFound = routes.findIndex((route) => route.status === 404 && route.dest === "/404.html");
  if (notFound === -1) throw new Error("No 404 catch-all in the routes");

  const negotiation: Route[] = [
    // Caches must key these pages on Accept, whichever version they get
    {
      src: `(?:${pagePaths.map(pathPattern).join("|")})`,
      headers: { Vary: "Accept" },
      continue: true,
    },
    { src: "^/.+\\.md$", headers: { "Content-Type": MARKDOWN_TYPE }, continue: true },
    ...pagePaths.map((path) => ({
      src: pathPattern(path),
      has: acceptsMarkdown,
      dest: markdownFile(path),
      headers: { "Content-Type": MARKDOWN_TYPE },
    })),
  ];

  const markdownNotFound: Route = {
    src: "^/.*$",
    has: acceptsMarkdown,
    dest: "/404.md",
    status: 404,
    headers: { "Content-Type": MARKDOWN_TYPE, Vary: "Accept" },
  };

  return [
    ...routes.slice(0, filesystem),
    ...negotiation,
    ...routes.slice(filesystem, notFound),
    markdownNotFound,
    {
      ...routes[notFound],
      headers: { ...routes[notFound].headers, Vary: "Accept" },
    },
    ...routes.slice(notFound + 1),
  ];
}
