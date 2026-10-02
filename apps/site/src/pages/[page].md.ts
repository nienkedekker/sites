import type { APIRoute, GetStaticPaths } from "astro";
import { site } from "../data/profile";
import { renderHome, renderNotFound, renderPage } from "../lib/markdown";
import { getHomeContent, getSitePages } from "../lib/site-pages";

export const getStaticPaths = (async () => {
  const pages = await getSitePages();
  return [
    { params: { page: "index" }, props: { markdown: renderHome(await getHomeContent()) } },
    { params: { page: "404" }, props: { markdown: renderNotFound(site) } },
    ...pages.map((page) => ({
      params: { page: page.slug },
      props: { markdown: renderPage(page) },
    })),
  ];
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(props.markdown, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
