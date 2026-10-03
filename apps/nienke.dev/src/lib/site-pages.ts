import { getCollection, getEntry } from "astro:content";
import { archiveCollections, archiveIntro } from "../data/archive";
import { links, linksIntro } from "../data/links";
import { ljIcons, ljIconsIntro } from "../data/lj-icons";
import { oldSites, oldSitesIntro } from "../data/old-sites";
import { tumblrIntro, tumblrSections, tumblrTagsNote } from "../data/tumblr";
import { fandoms, tumblrFirstYear, tumblrPosts, tumblrTags } from "../data/tumblr-posts";
import { profile, site } from "../data/profile";
import { cleanMarkdown, type HomeContent, type MarkdownPage } from "./markdown";

export interface SitePage extends MarkdownPage {
  slug: string;
}

const order = ["now", "uses", "links", "archive", "old-sites", "lj-icons", "tumblr", "colophon"];

export async function getSitePages(): Promise<SitePage[]> {
  const entries = await getCollection("pages", ({ id }) => id !== "home");

  const pages: SitePage[] = entries.map(({ id, data, body = "" }) => ({
    slug: id,
    title: data.title,
    description: data.description,
    lastUpdated: data.lastUpdated,
    body: cleanMarkdown(body, site),
  }));

  pages.push({
    slug: "links",
    title: "Links",
    description: linksIntro,
    body: links.map(({ name, href }) => `- [${name}](${href})`).join("\n"),
  });

  pages.push({
    slug: "archive",
    title: "Archive",
    description: archiveIntro,
    body: archiveCollections
      .map(({ slug, title, years, items, description, eras }) =>
        [
          `## [${title}](${site}/${slug}) (${years})`,
          `${description}. ${items}.`,
          eras.map(({ name, years }) => `- ${name}: ${years}`).join("\n"),
        ].join("\n\n")
      )
      .join("\n\n"),
  });

  pages.push({
    slug: "old-sites",
    title: "Old sites",
    description: oldSitesIntro,
    body: oldSites
      .map(({ domain, years, about, snapshots }) =>
        [
          `## ${domain} (${years})`,
          about,
          ...snapshots.map(({ date, title, note, quote, source }) =>
            [
              `### ${date}: ${title}`,
              note,
              quote && `> ${quote}`,
              source && `${source.label}\n\n\`\`\`\n${source.code}\n\`\`\``,
            ]
              .filter(Boolean)
              .join("\n\n")
          ),
        ].join("\n\n")
      )
      .join("\n\n"),
  });

  pages.push({
    slug: "lj-icons",
    title: "LiveJournal icons",
    description: ljIconsIntro,
    body: ljIcons.map((src) => `![](${site}${src})`).join("\n\n"),
  });

  pages.push({
    slug: "tumblr",
    title: "Tumblr",
    description: tumblrIntro,
    body: [
      "## Interests",
      "What I posted about based on surviving tags.",
      fandoms
        .map(({ name, counts }) => {
          const years = counts
            .map((count, i) => (count ? tumblrFirstYear + Math.floor(i / 4) : null))
            .filter((year) => year !== null);
          const total = counts.reduce((a, b) => a + b, 0);
          return `- ${name}: ${total} posts, ${years[0]}–${years.at(-1)}`;
        })
        .join("\n"),
      "## Tags",
      tumblrTagsNote,
      tumblrTags.map(({ name, count }) => `- ${name}: ${count}`).join("\n"),
      ...tumblrSections.flatMap(({ title, note, mine }) => [
        `## ${title}`,
        note,
        tumblrPosts
          .filter((post) => post.mine === mine)
          .map(
            ({ date, url, notes, text }) =>
              `- [${date}](${url}), ${notes} notes${text ? `: ${text}` : ""}`
          )
          .join("\n"),
      ]),
    ].join("\n\n"),
  });

  const rank = (slug: string) => (order.includes(slug) ? order.indexOf(slug) : order.length);
  return pages.sort((a, b) => rank(a.slug) - rank(b.slug));
}

export async function getHomeContent(): Promise<HomeContent> {
  const home = await getEntry("pages", "home");
  const pages = await getSitePages();

  return {
    site,
    name: profile.name,
    description: profile.description,
    intro: home?.body ?? "",
    pages: pages.map(({ slug, title, description }) => ({
      title,
      description,
      href: `${site}/${slug}.md`,
    })),
    email: profile.email,
    profiles: profile.profiles,
  };
}
