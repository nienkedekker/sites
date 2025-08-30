import { Suspense } from "react";
import { fetchStatsData } from "@/utils/fetch-stats-data";
import { ItemCountBarChart } from "@/components/charts/item-count-bar-chart";
import { CumulativeLineChart } from "@/components/charts/cumulative-line-chart";
import { type ChartConfig } from "@/components/ui/chart";
import { StatsPageSkeleton } from "@/components/skeletons/stats-skeleton";

// Extract stats content to a separate component for Suspense
async function StatsContent() {

  const statsData = await fetchStatsData();

  if (!statsData) {
    return (
      <div role="alert" className="text-center p-8">
        <p className="text-red-600">Unable to load chart data right now.</p>
        <p className="text-sm text-gray-500 mt-2">
          Please try refreshing the page.
        </p>
      </div>
    );
  }

  const chartConfig = {
    Book: {
      label: "Books",
      color: "hsl(var(--chart-1))",
    },
    Movie: {
      label: "Movies",
      color: "hsl(var(--chart-2))",
    },
    Show: {
      label: "Shows",
      color: "hsl(var(--chart-3))",
    },
  } satisfies ChartConfig;

  const {
    chartData,
    chartDataCurrentYear,
    chartDataCum,
    yearsLogged,
    currentYear,
  } = statsData;

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <ItemCountBarChart
        chartData={chartData ?? []}
        config={chartConfig}
        title="Items over time"
      >
        <div className="flex gap-2 font-medium leading-none">
          Total items logged across {yearsLogged} distinct years
        </div>
        <div className="leading-none text-muted-foreground">
          Displaying counts of Books, Movies, and TV Shows logged across all
          years.
        </div>
      </ItemCountBarChart>
      <ItemCountBarChart
        config={chartConfig}
        chartData={chartDataCurrentYear ?? []}
        title={`Items in ${currentYear}`}
      >
        <div className="flex gap-2 font-medium leading-none">
          Total items logged in {currentYear}
        </div>
        <div className="leading-none text-muted-foreground">
          Displaying counts of Books, Movies, and TV Shows logged this year.
        </div>
      </ItemCountBarChart>
      <div className="lg:col-span-2">
        <CumulativeLineChart
          chartData={chartDataCum ?? []}
          config={chartConfig}
        />
      </div>
    </div>
  );
}

export default function StatsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-4xl font-bold mb-8 -ml-6 px-6 text-sky-950 dark:text-sky-50">
        Stats
      </h1>
      <Suspense fallback={<StatsPageSkeleton />}>
        <StatsContent />
      </Suspense>
    </div>
  );
}
