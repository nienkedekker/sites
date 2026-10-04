import { ImageResponse } from "next/og";
import { getCachedItems } from "@/utils/data/items";
import { itemsInGenre } from "@/utils/data/genres";
import {
  COLORS,
  Headline,
  OG_SIZE,
  OgFrame,
  SeriesCounts,
  countTypes,
  loadFonts,
  seriesText,
} from "@/utils/og";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ genre: string; subgenre?: string[] }> },
) {
  const { genre, subgenre } = await params;
  const found =
    !subgenre || subgenre.length === 1
      ? itemsInGenre(await getCachedItems(), genre, subgenre?.[0])
      : null;
  if (!found) return new Response("Not found", { status: 404 });

  const name = found.subgenre ?? found.genre;
  // Instrument Serif runs about 0.45em a character; fit the name on one line
  const headline = Math.round(
    Math.min(180, Math.max(72, 1056 / (name.length * 0.45))),
  );
  const eyebrow = found.subgenre ? found.genre : "Genre";
  const path = ["/genres", genre, ...(subgenre ?? [])].join("/");
  const fonts = await loadFonts(name, `${path} ${eyebrow} ${seriesText}`);

  return new ImageResponse(
    <OgFrame path={path}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 26, color: COLORS.soft, marginBottom: 32 }}>
          {eyebrow}
        </span>
        <Headline size={headline}>{name}</Headline>
        <SeriesCounts counts={countTypes(found.items)} skipZero />
      </div>
    </OgFrame>,
    {
      ...OG_SIZE,
      fonts,
      // ImageResponse caches for a year by default, but genres grow
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
