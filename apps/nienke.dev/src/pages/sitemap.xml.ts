import type { APIRoute } from "astro";
import { site } from "../data/profile";
import { renderSitemap } from "../lib/sitemap";
import { getSitePages } from "../lib/site-pages";

export const GET: APIRoute = async () => {
  const pages = await getSitePages();
  const entries = [
    { loc: `${site}/` },
    ...pages.map(({ slug, lastUpdated }) => ({
      loc: `${site}/${slug}`,
      lastmod: lastUpdated,
    })),
  ];

  return new Response(renderSitemap(entries), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
