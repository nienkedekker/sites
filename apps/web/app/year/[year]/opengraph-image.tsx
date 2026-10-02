import { ImageResponse } from "next/og";
import { getItemsForYear } from "@/utils/data/items";
import { hasMonthlyData, summarizeYear } from "@/utils/data/summary";

export const alt = "Books, movies and TV seasons logged on what.pm";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

const COLORS = {
  paper: "#fcfcfd",
  ink: "#0b0c0e",
  soft: "#5d626c",
  line: "#e8e8ec",
  books: "#0b0c0e",
  movies: "#3242a8",
  shows: "#8b909a",
};
const SERIES = [
  { key: "books", label: "books", color: COLORS.books },
  { key: "movies", label: "movies", color: COLORS.movies },
  { key: "shows", label: "TV seasons", color: COLORS.shows },
] as const;
const MONTHS = "JFMAMJJASOND".split("");
const CHART_HEIGHT = 220;

// Without a browser user agent Google Fonts serves TTF, which satori can read
async function loadFont(family: string, weight: number, text: string) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`,
  ).then((res) => res.text());
  const url = css.match(/src: url\((.+?)\) format/)?.[1];
  if (!url) throw new Error(`No font file for ${family}`);
  return fetch(url).then((res) => res.arrayBuffer());
}

export default async function Image({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const year = Number.parseInt((await params).year, 10);
  const result = await getItemsForYear(year);
  const items = result.success ? result.data : [];
  const summary = summarizeYear(items, year);
  const byMonth = hasMonthlyData(items, year);
  const total = summary.counts.books + summary.counts.movies + summary.counts.shows;
  const tallest = Math.max(
    1,
    ...summary.months.map((m) => m.books + m.movies + m.shows),
  );
  const largest = Math.max(
    1,
    summary.counts.books,
    summary.counts.movies,
    summary.counts.shows,
  );

  const monoText = `what.pm/year/${year} ${total} logged ${MONTHS.join("")} 0123456789 books movies TV seasons`;
  const fonts = await Promise.all([
    loadFont("Instrument+Serif", 400, `${year}what.`),
    loadFont("Geist+Mono", 400, monoText),
  ])
    .then(([serif, mono]) => [
      { name: "Serif", data: serif, weight: 400 as const },
      { name: "Mono", data: mono, weight: 400 as const },
    ])
    .catch(() => []);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: COLORS.paper,
          color: COLORS.ink,
          fontFamily: "Mono",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            fontSize: 26,
            color: COLORS.soft,
          }}
        >
          <span style={{ fontFamily: "Serif", fontSize: 48, color: COLORS.ink }}>
            what.
          </span>
          <span>{`what.pm/year/${year}`}</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 64,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontFamily: "Serif",
                fontSize: 240,
                lineHeight: 0.8,
                letterSpacing: -6,
              }}
            >
              {year}
            </span>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginTop: 40,
                fontSize: 26,
              }}
            >
              {SERIES.map(({ key, label, color }) => (
                <div
                  key={key}
                  style={{ display: "flex", alignItems: "center", gap: 14 }}
                >
                  <div style={{ width: 16, height: 16, background: color }} />
                  <span>{`${summary.counts[key]} ${label}`}</span>
                </div>
              ))}
            </div>
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
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                width: 500,
              }}
            >
              {SERIES.map(({ key, color }) => (
                <div
                  key={key}
                  style={{
                    height: 40,
                    width: `${(summary.counts[key] / largest) * 100}%`,
                    background: color,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
