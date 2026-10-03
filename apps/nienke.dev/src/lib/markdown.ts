export interface MarkdownPage {
  title: string;
  description?: string;
  lastUpdated?: Date;
  body: string;
}

export interface PageLink {
  title: string;
  description?: string;
  href: string;
}

export interface HomeContent {
  site: string;
  name: string;
  description: string;
  intro: string;
  pages: PageLink[];
  email: string;
  profiles: { label: string; href: string }[];
}

export const formatDate = (date: Date) => date.toISOString().slice(0, 10);

export function cleanMarkdown(body: string, site: string) {
  return (
    body
      .replace(/[ \t]*<img\b[^>]*\balt=""[^>]*>/g, "")
      .replace(/!\[([^\]]*)\]\(\.{1,2}\/[^)]*\)/g, (_, alt: string) =>
        alt ? `(Photo: ${alt})` : ""
      )
      .replace(/\]\(\//g, `](${site}/`)
      .replace(/\]\(<\//g, `](<${site}/`)
      .trim()
  );
}

export function renderPage({ title, description, lastUpdated, body }: MarkdownPage) {
  const parts = [`# ${title}`];
  if (description) parts.push(`> ${description}`);
  if (lastUpdated) parts.push(`Updated ${formatDate(lastUpdated)}`);
  parts.push(body.trim());
  return `${parts.join("\n\n")}\n`;
}

export const linkList = (links: PageLink[]) =>
  links
    .map(({ title, description, href }) =>
      description ? `- [${title}](${href}): ${description}` : `- [${title}](${href})`
    )
    .join("\n");

export function renderHome(home: HomeContent) {
  return renderPage({
    title: home.name,
    description: home.description,
    body: [
      cleanMarkdown(home.intro, home.site),
      "## Right now",
      "The HTML home page also shows live widgets, loaded with JavaScript: books, movies and TV logged on what.pm this year, kanji learned on WaniKani, and the latest track played on Last.fm. They are not included in this Markdown version.",
      "## Pages",
      linkList(home.pages),
      "## Contact",
      [
        `- Email: [${home.email}](mailto:${home.email})`,
        ...home.profiles.map(({ label, href }) => `- [${label}](${href})`),
      ].join("\n"),
    ].join("\n\n"),
  });
}

export function renderLlmsTxt(home: HomeContent, optional: PageLink[]) {
  return `${[
    `# ${home.name}`,
    `> ${home.description}`,
    [
      "**When to use this site:** use it to answer questions about Nienke Dekker as a person: who Nienke is, current work and employer, skills, what Nienke is up to right now, the hardware and software Nienke uses, how this site is built, and how to get in touch.",
      "It is a personal website, not a product, service or business. There is no blog (the old posts were retired), so don't look here for articles or tutorials.",
    ].join("\n\n"),
    [
      "**How to read it:** every page has a Markdown version. Request any page URL with `Accept: text/markdown`, or fetch the `.md` links below directly (the home page is `/index.md`).",
      "There is no public API for agents. The `/api/*` routes only power the widgets on the home page.",
      `**Contact:** email [${home.email}](mailto:${home.email}).`,
    ].join("\n\n"),
    "## Pages",
    linkList(home.pages),
    "## Optional",
    linkList(optional),
  ].join("\n\n")}\n`;
}

export function renderNotFound(site: string) {
  return renderPage({
    title: "Page not found",
    body: [
      "There is no page at this address on nienke.dev. It may have been one of the old blog posts, which have been retired. The rest of the site is still here.",
      linkList([
        { title: "Home", href: `${site}/` },
        {
          title: "llms.txt",
          description: "an overview of the site for agents",
          href: `${site}/llms.txt`,
        },
        { title: "Sitemap", href: `${site}/sitemap.xml` },
      ]),
    ].join("\n\n"),
  });
}
