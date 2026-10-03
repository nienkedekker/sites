import type { APIRoute } from "astro";
import { site } from "../data/profile";
import { renderLlmsTxt } from "../lib/markdown";
import { getHomeContent } from "../lib/site-pages";

export const GET: APIRoute = async () => {
  const home = await getHomeContent();
  const pages = [
    {
      title: "Home",
      description: "Who Nienke is and what Nienke works on",
      href: `${site}/index.md`,
    },
    ...home.pages,
  ];
  const optional = [
    { title: "Sitemap", description: "every page on the site", href: `${site}/sitemap.xml` },
  ];

  return new Response(renderLlmsTxt({ ...home, pages }, optional), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
