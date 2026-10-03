import { getCollection, getEntry } from "astro:content";
import { links, linksIntro } from "../data/links";
import { profile, site } from "../data/profile";
import { cleanMarkdown, type HomeContent, type MarkdownPage } from "./markdown";

export interface SitePage extends MarkdownPage {
  slug: string;
}

const order = ["now", "uses", "links", "colophon"];

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
