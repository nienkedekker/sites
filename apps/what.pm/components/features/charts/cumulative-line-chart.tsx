"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import Panel from "@nienke/ui/panel";
import { useLessMotion } from "@/components/layouts/low-power";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface CumulativeLineChartProps {
  chartData: Array<{ year: number } & Record<string, number>>;
  config: ChartConfig;
}

export function CumulativeLineChart({
  chartData,
  config,
}: CumulativeLineChartProps) {
  const categories = Object.keys(config);
  const lessMotion = useLessMotion();

  return (
    <Panel id="cumulative-heading" title="Total logged over time">
      <ChartContainer config={config} className="max-h-96 w-full">
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{ left: -20, right: 12 }}
        >
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          {categories.map((category) => (
            <Line
              key={category}
              type="linear"
              dataKey={category}
              stroke={
                config[category as keyof typeof config]?.color || "gray"
              }
              strokeWidth={2}
              dot={false}
              isAnimationActive={!lessMotion}
            />
          ))}
        </LineChart>
      </ChartContainer>
      <p className="mt-5 border-t border-line pt-5 text-sm text-ink-soft">
        Tracking cumulative logs of books, movies, and shows over the years.
      </p>
    </Panel>
  );
}
