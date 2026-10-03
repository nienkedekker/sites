"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatDate } from "@nienke/ui/format";

export interface PaceSeries {
  year: number;
  current: boolean;
  previous: boolean;
}

interface PaceChartProps {
  data: Array<{ day: number } & Record<string, number | null>>;
  series: PaceSeries[];
}

const MONTH_STARTS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

const dayLabel = (day: number, options: Intl.DateTimeFormatOptions) =>
  formatDate(new Date(Date.UTC(2001, 0, day + 1)), options);

function strokeFor({ current, previous }: PaceSeries) {
  if (current) return "var(--movies)";
  if (previous) return "var(--ink-faint)";
  return "var(--line-strong)";
}

export function PaceChart({ data, series }: PaceChartProps) {
  const config: ChartConfig = Object.fromEntries(
    series.map((s) => [
      String(s.year),
      { label: String(s.year), color: strokeFor(s) },
    ]),
  );
  // Draw the faint years first so this year and last sit on top
  const ordered = [...series].sort(
    (a, b) =>
      Number(a.current) * 2 +
      Number(a.previous) -
      (Number(b.current) * 2 + Number(b.previous)),
  );

  return (
    <ChartContainer config={config} className="h-64 w-full">
      <LineChart
        accessibilityLayer
        data={data}
        margin={{ left: -20, right: 12 }}
      >
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis
          dataKey="day"
          type="number"
          domain={[0, 365]}
          ticks={MONTH_STARTS}
          tickFormatter={(day: number) => dayLabel(day, { month: "narrow" })}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip
          cursor={{ stroke: "var(--line-strong)" }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) =>
                dayLabel(Number(payload?.[0]?.payload?.day ?? 0), {
                  month: "long",
                  day: "numeric",
                })
              }
            />
          }
        />
        {ordered.map((s) => (
          <Line
            key={s.year}
            type="stepAfter"
            dataKey={String(s.year)}
            stroke={strokeFor(s)}
            strokeWidth={s.current ? 2.5 : s.previous ? 1.5 : 1}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
