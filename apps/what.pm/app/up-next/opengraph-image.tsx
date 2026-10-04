import { ImageResponse } from "next/og";
import { getUpNext } from "@/utils/data/up-next";
import {
  COLORS,
  Headline,
  OG_SIZE,
  OgFrame,
  SERIES,
  SeriesCounts,
  countTypes,
  loadFonts,
} from "@/utils/og";

export const alt = "Books, movies and TV shows I want to get to next";
export const size = OG_SIZE;
export const contentType = "image/png";
const SHOWN = 6;

export default async function Image() {
  const upNext = await getUpNext();
  const shown = upNext.slice(0, SHOWN);
  const fonts = await loadFonts();

  return new ImageResponse(
    <OgFrame path="/up-next">
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 64,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Headline size={180}>Up next</Headline>
          <SeriesCounts
            counts={countTypes(upNext)}
            nouns={{ shows: "TV show" }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 440,
            borderTop: `2px solid ${COLORS.ink}`,
            fontSize: 22,
          }}
        >
          {shown.map(({ itemtype, external_id, title }) => (
            <div
              key={`${itemtype}|${external_id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 0",
                borderBottom: `1px solid ${COLORS.line}`,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  flexShrink: 0,
                  background: SERIES.find(({ type }) => type === itemtype)!
                    .color,
                }}
              />
              <span
                style={{
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                {title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </OgFrame>,
    { ...size, fonts },
  );
}
