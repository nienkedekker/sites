import { ImageResponse } from "next/og";
import { formatCount } from "@nienke/ui/format";
import { getLogFacts } from "@/utils/data/about";
import {
  COLORS,
  Headline,
  OG_SIZE,
  OgFrame,
  SeriesBars,
  SeriesCounts,
  loadFonts,
} from "@/utils/og";
import { SITE_NAME } from "@/utils/constants/site";

export const alt = `Every book, movie and TV season logged on ${SITE_NAME}`;
export const size = OG_SIZE;
export const contentType = "image/png";
export default async function Image() {
  const facts = await getLogFacts();
  const total = formatCount(facts.total);
  const since = `logged since ${facts.firstYear}`;
  const fonts = await loadFonts();

  return new ImageResponse(
    <OgFrame path="">
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 64,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Headline>{total}</Headline>
          <span style={{ marginTop: 24, fontSize: 26, color: COLORS.soft }}>
            {since}
          </span>
          <SeriesCounts counts={facts} />
        </div>
        <SeriesBars counts={facts} />
      </div>
    </OgFrame>,
    { ...size, fonts },
  );
}
