"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCount, formatDate } from "@nienke/ui/format";

export interface PacePoint {
  day: number;
  current: number | null;
  typical: number;
  range: [number, number];
}

interface PaceChartProps {
  data: PacePoint[];
  color: string;
}

const MONTH_STARTS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

const dayLabel = (day: number, options: Intl.DateTimeFormatOptions) =>
  formatDate(new Date(Date.UTC(2001, 0, day + 1)), options);

function PaceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: PacePoint }>;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  const [low, high] = point.range.map(Math.round);

  return (
    <div className="grid min-w-[8rem] gap-1.5 border border-line bg-panel px-3 py-2 text-xs text-ink">
      <p className="font-medium">
        {dayLabel(point.day, { month: "long", day: "numeric" })}
      </p>
      {point.current !== null && (
        <p className="flex justify-between gap-4">
          <span className="text-ink-soft">This year</span>
          <span className="font-mono tabular-nums">
            {formatCount(point.current)}
          </span>
        </p>
      )}
      <p className="flex justify-between gap-4">
        <span className="text-ink-soft">Typical</span>
        <span className="font-mono tabular-nums">
          {formatCount(Math.round(point.typical))}
          {low !== high && (
            <span className="text-ink-faint">
              {" "}
              ({formatCount(low)}–{formatCount(high)})
            </span>
          )}
        </span>
      </p>
    </div>
  );
}

export function PaceChart({ data, color }: PaceChartProps) {
  const config: ChartConfig = {
    current: { label: "This year", color },
    typical: { label: "Typical", color: "var(--ink-faint)" },
  };

  return (
    <ChartContainer config={config} className="h-40 w-full">
      <ComposedChart
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
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          allowDecimals={false}
        />
        <ChartTooltip
          cursor={{ stroke: "var(--line-strong)" }}
          content={<PaceTooltip />}
        />
        <Area
          type="linear"
          dataKey="range"
          stroke="none"
          fill="var(--line-strong)"
          fillOpacity={0.4}
          isAnimationActive={false}
        />
        <Line
          type="linear"
          dataKey="typical"
          stroke="var(--ink-faint)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="stepAfter"
          dataKey="current"
          stroke={color}
          strokeWidth={2.5}
          dot={false}
          connectNulls={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ChartContainer>
  );
}
