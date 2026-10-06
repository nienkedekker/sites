export type MarkdownTarget =
  | { kind: "year"; year: number | null }
  | { kind: "about" }
  | { kind: "missing" }
  | { kind: "skip" };

const HTML_ONLY = new Set([
  "/stats",
  "/search",
  "/create",
  "/settings",
  "/recs",
  "/up-next",
  "/sign-in",
]);
const SKIP_PREFIXES = [
  "/_next/",
  "/api/",
  "/auth/",
  "/settings/",
  "/genres/",
  "/og/",
  "/markdown",
];

// Which Markdown version a path has. "skip" leaves the request to Next as-is;
// "missing" is a path no page answers, so it gets a Markdown 404.
export function markdownTarget(pathname: string): MarkdownTarget {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  if (path === "/") return { kind: "year", year: null };
  if (path === "/about") return { kind: "about" };

  const year = path.match(/^\/year\/(\d+)$/);
  if (year) return { kind: "year", year: Number(year[1]) };

  if (
    HTML_ONLY.has(path) ||
    SKIP_PREFIXES.some((prefix) => path.startsWith(prefix)) ||
    /^\/year\/\d+\//.test(path) ||
    /\/(opengraph-image|twitter-image|icon|apple-icon)$/.test(path) ||
    /\.[a-z0-9]+$/i.test(path)
  ) {
    return { kind: "skip" };
  }

  return { kind: "missing" };
}

function mediaRanges(accept: string) {
  return accept.split(",").flatMap((part) => {
    const [range, ...params] = part.trim().toLowerCase().split(";");
    if (!range) return [];
    const q = params
      .map((param) => param.trim().match(/^q=([\d.]+)$/))
      .find(Boolean);
    return [{ range: range.trim(), q: q ? Number(q[1]) : 1 }];
  });
}

// Markdown only wins when it's asked for by name, so `*/*` keeps getting HTML
export function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  const ranges = mediaRanges(accept);
  const markdown =
    ranges.find(({ range }) => range === "text/markdown")?.q ?? 0;
  const html =
    ranges.find(({ range }) => range === "text/html")?.q ??
    ranges.find(({ range }) => range === "text/*")?.q ??
    ranges.find(({ range }) => range === "*/*")?.q ??
    0;
  return markdown > 0 && markdown >= html;
}
