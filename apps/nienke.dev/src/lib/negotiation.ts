import { MARKDOWN_TYPE, VARY, markdownFile } from "./markdown-routes.ts";

export const HTML = "text/html";
export const MARKDOWN = "text/markdown";

interface MediaRange {
  type: string;
  q: number;
  specificity: number;
}

function parseAccept(header: string): MediaRange[] {
  return header
    .split(",")
    .map((entry) => {
      const [type, ...params] = entry.split(";").map((part) => part.trim().toLowerCase());
      let q = 1;
      for (const param of params) {
        const [name, value] = param.split("=").map((part) => part.trim());
        if (name === "q" && !Number.isNaN(Number(value)))
          q = Math.min(1, Math.max(0, Number(value)));
      }
      const specificity = type === "*/*" ? 0 : type.endsWith("/*") ? 1 : 2;
      return { type, q, specificity };
    })
    .filter(({ type }) => type.includes("/"));
}

const covers = (range: MediaRange, type: string) =>
  range.type === "*/*" ||
  range.type === type ||
  (range.type.endsWith("/*") && type.startsWith(range.type.slice(0, -1)));

// Per RFC 9110 §12.5.1: the most specific range decides a type's q, the highest q wins, ties go
// to the client's order and then to the server's (so HTML stays the default), and q=0 means never.
export function preferredType(accept: string | null, produces: string[]): string | null {
  const ranges = parseAccept(accept ?? "");
  if (ranges.length === 0) return produces[0];

  const scored = produces.map((type) => {
    let best: MediaRange | undefined;
    let position = Infinity;
    ranges.forEach((range, index) => {
      if (covers(range, type) && (!best || range.specificity > best.specificity)) {
        best = range;
        position = index;
      }
    });
    return { type, q: best?.q, position };
  });

  // A header that only rules types out ("text/markdown;q=0") leaves the rest acceptable.
  if (ranges.every(({ q }) => q === 0)) {
    return scored.find(({ q }) => q === undefined)?.type ?? null;
  }

  let winner: (typeof scored)[number] | undefined;
  for (const candidate of scored) {
    if (!candidate.q) continue;
    if (
      !winner ||
      candidate.q > winner.q! ||
      (candidate.q === winner.q && candidate.position < winner.position)
    ) {
      winner = candidate;
    }
  }
  return winner?.type ?? null;
}

const pagePath = (pathname: string) => (pathname === "/" ? "/" : pathname.replace(/\/$/, ""));

export async function negotiate(
  request: Request,
  pages: string[],
  fetchFile: typeof fetch = fetch
): Promise<Response> {
  const url = new URL(request.url);
  const path = pagePath(url.searchParams.get("path") ?? url.pathname);
  const accept = request.headers.get("accept");
  const type = preferredType(accept, [HTML, MARKDOWN]);
  const isPage = pages.includes(path);

  if (isPage && !type) {
    return new Response(
      `This page is available as:\n- ${HTML}\n- ${MARKDOWN}\n\nYou asked for: ${accept}\n`,
      {
        status: 406,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          Vary: VARY,
        },
      }
    );
  }

  const markdown = type === MARKDOWN;
  const file = isPage ? (markdown ? markdownFile(path) : path) : markdown ? "/404.md" : "/404.html";
  const status = isPage ? 200 : 404;

  // Asking for the file as HTML takes the static route, so this never loops back here.
  const upstream = await fetchFile(new URL(file, url.origin), {
    method: request.method === "HEAD" ? "HEAD" : "GET",
    headers: { accept: HTML },
  });

  const headers = new Headers({ Vary: VARY });
  headers.set(
    "Content-Type",
    markdown ? MARKDOWN_TYPE : (upstream.headers.get("content-type") ?? "text/html; charset=utf-8")
  );
  if (markdown && isPage) headers.set("Content-Location", file);

  return new Response(upstream.body, {
    status: upstream.ok ? status : upstream.status,
    headers,
  });
}
