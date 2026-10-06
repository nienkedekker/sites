import type { TypedItem } from "@/types/shared";
import type { LogFacts } from "@/utils/data/about";
import { CATEGORY_CONFIG } from "@/utils/constants/app";
import {
  OWNER_FIRST_NAME,
  OWNER_NAME,
  OWNER_URL,
  SITE_NAME,
  SITE_URL,
  SOURCE_URL,
} from "@/utils/constants/site";

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
  `---\n\n${links.join("\n")}\n- [Everything agents can read on ${SITE_NAME}](${SITE_URL}/llms.txt)\n`;

export function yearMarkdown(
  year: number,
  items: TypedItem[],
  isCurrentYear: boolean,
) {
  const intro = isCurrentYear
    ? `What ${OWNER_FIRST_NAME} has read and watched so far this year`
    : `What ${OWNER_FIRST_NAME} read and watched in ${year}`;

  const sections = CATEGORY_CONFIG.map(({ title, type }) => {
    const ofType = items.filter((item) => item.itemtype === type);
    const list = ofType.length
      ? ofType.map((item) => `- ${itemLine(item)}`).join("\n")
      : "Nothing logged yet.";
    return `## ${title} (${ofType.length})\n\n${list}`;
  });

  return `# ${year} · ${SITE_NAME}

${intro}, as logged on ${SITE_NAME}: ${items.length} ${items.length === 1 ? "thing" : "things"} in total.

${sections.join("\n\n")}

${footer([
  `- [This year on the web](${SITE_URL}/year/${year})`,
  `- [The same year as JSON](${SITE_URL}/api/v1/summary?year=${year})`,
])}`;
}

export function aboutMarkdown(facts: LogFacts | null) {
  const numbers = facts
    ? `\n\n## The log in numbers\n\n- ${facts.total} things logged across ${facts.yearCount} years\n- Books: ${facts.books}\n- Movies: ${facts.movies}\n- TV seasons: ${facts.shows}\n- Logging since [${facts.firstYear}](${SITE_URL}/year/${facts.firstYear})`
    : "";

  return `# About · ${SITE_NAME}

${SITE_NAME} is where [${OWNER_NAME}](${OWNER_URL}) logs every book read, movie watched and TV season watched, year by year. The source code is on [GitHub](${SOURCE_URL}).${numbers}

${footer([`- [This year](${SITE_URL}/)`])}`;
}

export function notFoundMarkdown(pathname: string) {
  return `# Not found · ${SITE_NAME}

Nothing's logged at \`${pathname.replace(/`/g, "")}\` on ${SITE_NAME}. The page may never have existed, or it lives under another year.

- [This year's log](${SITE_URL}/)
- [About ${SITE_NAME}](${SITE_URL}/about)
- [Everything agents can read on ${SITE_NAME}](${SITE_URL}/llms.txt)
`;
}
