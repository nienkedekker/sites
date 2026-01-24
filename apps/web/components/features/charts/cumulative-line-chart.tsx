"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Logged Items Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="max-h-96 w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ left: -20, right: 12 }}
          >
            <CartesianGrid vertical={false} />
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
                type="monotone"
                dataKey={category}
                stroke={
                  config[category as keyof typeof config]?.color || "gray"
                }
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <p className=" text-muted-foreground">
          Tracking cumulative logs of books, movies, and shows over the years.
        </p>
      </CardFooter>
    </Card>
  );
}
