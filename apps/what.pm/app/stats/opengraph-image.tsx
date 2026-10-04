import { ImageResponse } from "next/og";
import { getStatsData } from "@/utils/data/stats";
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

export const alt = "Stats for every year logged on what.pm";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

const CHART_WIDTH = 560;
const CHART_HEIGHT = 220;
const GAP = 4;

export default async function Image() {
  const { years } = await getStatsData();
  const totals = countTypes(
    years.flatMap(({ entries }) =>
      entries.map(({ type }) => ({ itemtype: type })),
    ),
  );
  const perYear = years.map(({ year, entries }) => ({
    year,
    counts: countTypes(entries.map(({ type }) => ({ itemtype: type }))),
    total: entries.length,
  }));
  const tallest = Math.max(1, ...perYear.map(({ total }) => total));
  const barWidth =
    (CHART_WIDTH - GAP * Math.max(0, perYear.length - 1)) /
    Math.max(1, perYear.length);
  const first = perYear[0]?.year ?? "";
  const last = perYear.at(-1)?.year ?? "";

  const fonts = await loadFonts();

  return new ImageResponse(
    <OgFrame path="/stats">
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 64,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Headline size={200}>Stats</Headline>
          <SeriesCounts counts={totals} />
        </div>

        {perYear.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: GAP,
                width: CHART_WIDTH,
                height: CHART_HEIGHT,
                borderBottom: `2px solid ${COLORS.ink}`,
              }}
            >
              {perYear.map(({ year, counts }) => (
                <div
                  key={year}
                  style={{
                    display: "flex",
                    flexDirection: "column-reverse",
                    width: barWidth,
                  }}
                >
                  {SERIES.map(({ key, color }) => (
                    <div
                      key={key}
                      style={{
                        height: (counts[key] / tallest) * CHART_HEIGHT,
                        background: color,
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 18,
                color: COLORS.soft,
              }}
            >
              <span>{first}</span>
              <span>{last}</span>
            </div>
          </div>
        )}
      </div>
    </OgFrame>,
    { ...size, fonts },
  );
}
