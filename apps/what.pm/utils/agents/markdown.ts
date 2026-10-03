import type { TypedItem } from "@/types/shared";
import type { LogFacts } from "@/utils/data/about";
import { CATEGORY_CONFIG } from "@/utils/constants/app";
import { SITE } from "@/utils/agents/negotiate";

const escape = (value: string) => value.replace(/([\\`*_[\]<>#])/g, "\\$1");

function itemLine(item: TypedItem) {
  const title = `**${escape(item.title)}**`;
  switch (item.itemtype) {
    case "Book":
      return `${title} by ${escape(item.author)} (${item.published_year})${item.redo ? ", reread" : ""}`;
    case "Movie":
      return `${title}, directed by ${escape(item.director)} (${item.published_year})${item.redo ? ", rewatched" : ""}`;
    case "Show":
      return `${title}, season ${item.season}${item.in_progress ? ", still watching" : ""}${item.redo ? ", rewatched" : ""}`;
  }
}

const footer = (links: string[]) =>
  `---\n\n${links.join("\n")}\n- [Everything agents can read on what.pm](${SITE}/llms.txt)\n`;

export function yearMarkdown(
  year: number,
  items: TypedItem[],
  isCurrentYear: boolean,
) {
  const intro = isCurrentYear
    ? "What Nienke has read and watched so far this year"
    : `What Nienke read and watched in ${year}`;

  const sections = CATEGORY_CONFIG.map(({ title, type }) => {
    const ofType = items.filter((item) => item.itemtype === type);
    const list = ofType.length
      ? ofType.map((item) => `- ${itemLine(item)}`).join("\n")
      : "Nothing logged yet.";
    return `## ${title} (${ofType.length})\n\n${list}`;
  });

  return `# ${year} · what.pm

${intro}, as logged on what.pm: ${items.length} ${items.length === 1 ? "thing" : "things"} in total.

${sections.join("\n\n")}

${footer([
  `- [This year on the web](${SITE}/year/${year})`,
  `- [The same year as JSON](${SITE}/api/v1/summary?year=${year})`,
])}`;
}

export function aboutMarkdown(facts: LogFacts | null) {
  const numbers = facts
    ? `\n\n## The log in numbers\n\n- ${facts.total} things logged across ${facts.yearCount} years\n- Books: ${facts.books}\n- Movies: ${facts.movies}\n- TV seasons: ${facts.shows}\n- Logging since [${facts.firstYear}](${SITE}/year/${facts.firstYear})`
    : "";

  return `# About · what.pm

what.pm is where [Nienke Dekker](https://nienke.dev) logs every book read, movie watched and TV season watched, year by year. The source code is on [GitHub](https://github.com/nienkedekker/sites).${numbers}

${footer([`- [This year](${SITE}/)`])}`;
}

export function notFoundMarkdown(pathname: string) {
  return `# Not found · what.pm

Nothing's logged at \`${pathname.replace(/`/g, "")}\` on what.pm. The page may never have existed, or it lives under another year.

- [This year's log](${SITE}/)
- [About what.pm](${SITE}/about)
- [Everything agents can read on what.pm](${SITE}/llms.txt)
`;
}
