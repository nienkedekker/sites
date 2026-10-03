export interface SitemapEntry {
  loc: string;
  lastmod?: Date;
}

const escapeXml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]!
  );

export function renderSitemap(entries: SitemapEntry[]) {
  const urls = entries.map(({ loc, lastmod }) => {
    const date = lastmod ? `\n    <lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>` : "";
    return `  <url>\n    <loc>${escapeXml(loc)}</loc>${date}\n  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
}
