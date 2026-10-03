export interface Route {
  src?: string;
  dest?: string;
  headers?: Record<string, string>;
  status?: number;
  continue?: boolean;
  handle?: string;
  has?: { type: string; key: string; value?: string }[];
  missing?: { type: string; key: string; value?: string }[];
}

export const MARKDOWN_TYPE = "text/markdown; charset=utf-8";
export const VARY = "Accept, Accept-Encoding";
export const NEGOTIATE_FUNCTION = "_negotiate";

// Browsers name text/html without a q-value and never mention Markdown, so their pages stay static.
// Everything else goes to the negotiate function, which ranks the header properly.
export const needsNegotiation = {
  type: "header",
  key: "accept",
  value: "(?i:.*(?:text/markdown|text/html\\s*;[^,]*q=|;\\s*q=0(?:\\.0*)?\\s*(?:[,;]|$)).*)",
};

export const acceptsHtml = {
  type: "header",
  key: "accept",
  value: "(?i:.*(?:text/html|text/\\*|\\*/\\*).*)",
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const pathPattern = (path: string) => (path === "/" ? "/" : `${escapeRegex(path)}/?`);

export const markdownFile = (path: string) => (path === "/" ? "/index.md" : `${path}.md`);

const negotiateDest = `/${NEGOTIATE_FUNCTION}?path=$1`;

export function addMarkdownRoutes(routes: Route[], pagePaths: string[]): Route[] {
  const filesystem = routes.findIndex((route) => route.handle === "filesystem");
  if (filesystem === -1) throw new Error("No filesystem phase in the routes");

  const notFound = routes.findIndex((route) => route.status === 404 && route.dest === "/404.html");
  if (notFound === -1) throw new Error("No 404 catch-all in the routes");

  const pages = `^(${pagePaths.map(pathPattern).join("|")})$`;

  const negotiation: Route[] = [
    { src: pages, headers: { Vary: VARY }, continue: true },
    { src: "^/.+\\.md$", headers: { "Content-Type": MARKDOWN_TYPE }, continue: true },
    { src: pages, has: [needsNegotiation], dest: negotiateDest },
    {
      src: pages,
      has: [{ type: "header", key: "accept" }],
      missing: [acceptsHtml],
      dest: negotiateDest,
    },
  ];

  return [
    ...routes.slice(0, filesystem),
    ...negotiation,
    ...routes.slice(filesystem, notFound),
    { src: "^(/.*)$", has: [needsNegotiation], dest: negotiateDest },
    {
      ...routes[notFound],
      headers: { ...routes[notFound].headers, Vary: VARY },
    },
    ...routes.slice(notFound + 1),
  ];
}
