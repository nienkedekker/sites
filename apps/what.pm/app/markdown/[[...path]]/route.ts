import { getItemsForYear } from "@/utils/data/items";
import { getLogFacts, type LogFacts } from "@/utils/data/about";
import { getCurrentYear } from "@/utils/formatters/date";
import { markdownTarget } from "@/utils/agents/negotiate";
import {
  aboutMarkdown,
  notFoundMarkdown,
  yearMarkdown,
} from "@/utils/agents/markdown";

// Middleware rewrites requests that ask for text/markdown here
const markdown = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    },
  });

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path = [] } = await params;
  const pathname = `/${path.join("/")}`;
  const target = markdownTarget(pathname);

  if (target.kind === "about") {
    let facts: LogFacts | null = null;
    try {
      facts = await getLogFacts();
    } catch (error) {
      console.error("Error loading log facts:", error);
    }
    return markdown(aboutMarkdown(facts));
  }

  if (target.kind === "year") {
    const currentYear = getCurrentYear();
    const year = target.year ?? currentYear;
    const result = await getItemsForYear(year);
    if (!result.success) {
      return markdown(
        "# Unavailable · what.pm\n\nThe log couldn't be loaded. Try again in a moment.\n",
        503,
      );
    }
    return markdown(yearMarkdown(year, result.data, year === currentYear));
  }

  return markdown(notFoundMarkdown(pathname), 404);
}
