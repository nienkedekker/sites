import { getRecentItems } from "@/utils/data/items";
import type { TypedItem } from "@/types/shared";

export const revalidate = 3600;

const SITE = "https://what.pm";
const LIMIT = 50;

const escape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

function headline(item: TypedItem) {
  switch (item.itemtype) {
    case "Book":
      return `${item.redo ? "Reread" : "Read"} ${item.title} by ${item.author}`;
    case "Movie":
      return `${item.redo ? "Rewatched" : "Watched"} ${item.title} (${item.published_year})`;
    case "Show": {
      const verb = item.in_progress
        ? "Watching"
        : item.redo
          ? "Rewatched"
          : "Watched";
      return `${verb} ${item.title}, season ${item.season}`;
    }
  }
}

function detail(item: TypedItem) {
  switch (item.itemtype) {
    case "Book":
      return `A book by ${item.author}, published in ${item.published_year}.`;
    case "Movie":
      return `A movie by ${item.director}, released in ${item.published_year}.`;
    case "Show":
      return `Season ${item.season}, first aired in ${item.published_year}.`;
  }
}

export async function GET() {
  const result = await getRecentItems(LIMIT);
  if (!result.success) {
    return new Response("Feed unavailable", { status: 503 });
  }

  const entries = result.data
    .map((item) => {
      const link = `${SITE}/year/${item.belongs_to_year}`;
      const date = item.created_at
        ? `\n      <pubDate>${new Date(item.created_at).toUTCString()}</pubDate>`
        : "";
      return `    <item>
      <title>${escape(headline(item))}</title>
      <link>${link}</link>
      <guid isPermaLink="false">${item.id}</guid>
      <category>${item.itemtype}</category>
      <description>${escape(detail(item))}</description>${date}
    </item>`;
    })
    .join("\n");

  const updated = result.data[0]?.created_at;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>what.</title>
    <link>${SITE}</link>
    <description>Books, movies and TV seasons, as I log them.</description>
    <language>en</language>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />${
      updated
        ? `\n    <lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>`
        : ""
    }
${entries}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
