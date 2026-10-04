import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { getItemsForYear, isLoggedYear, parseYear } from "@/utils/data/items";
import { hasMonthlyData, summarizeYear } from "@/utils/data/summary";
import {
  COLORS,
  Headline,
  OG_SIZE,
  OgFrame,
  SERIES,
  SeriesBars,
  SeriesCounts,
  loadFonts,
  seriesText,
} from "@/utils/og";

export const alt = "Books, movies and TV seasons logged on what.pm";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

const MONTHS = "JFMAMJJASOND".split("");
const CHART_HEIGHT = 220;

export default async function Image({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const year = parseYear((await params).year);
  if (year === null || !(await isLoggedYear(year))) notFound();
  const result = await getItemsForYear(year);
  if (!result.success) throw new Error(result.error);
  const items = result.data;
  const summary = summarizeYear(items, year);
  const byMonth = hasMonthlyData(items, year);
  const tallest = Math.max(
    1,
    ...summary.months.map((m) => m.books + m.movies + m.shows),
  );

  const path = `/year/${year}`;
  const fonts = await loadFonts(
    String(year),
    `${path} ${MONTHS.join("")} ${seriesText}`,
  );

  return new ImageResponse(
    <OgFrame path={path}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 64,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Headline>{year}</Headline>
          <SeriesCounts counts={summary.counts} />
        </div>

        {byMonth ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 8,
                height: CHART_HEIGHT,
                borderBottom: `2px solid ${COLORS.ink}`,
              }}
            >
              {summary.months.map((month) => (
                <div
                  key={month.month}
                  style={{
                    display: "flex",
                    flexDirection: "column-reverse",
                    width: 36,
                  }}
                >
                  {SERIES.map(({ key, color }) => (
                    <div
                      key={key}
                      style={{
                        height: (month[key] / tallest) * CHART_HEIGHT,
                        background: color,
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, fontSize: 18 }}>
              {MONTHS.map((month, i) => (
                <span
                  key={i}
                  style={{
                    width: 36,
                    display: "flex",
                    justifyContent: "center",
                    color: COLORS.soft,
                  }}
                >
                  {month}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <SeriesBars counts={summary.counts} />
        )}
      </div>
    </OgFrame>,
    { ...size, fonts },
  );
}
