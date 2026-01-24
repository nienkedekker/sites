import { Suspense } from "react";
import { fetchStatsData } from "@/utils/fetch-stats-data";
import { ItemCountBarChart } from "@/components/features/charts/item-count-bar-chart";
import { CumulativeLineChart } from "@/components/features/charts/cumulative-line-chart";
import { StatsPageSkeleton } from "@/components/features/skeletons/stats-skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { CHART_CONFIG } from "@/utils/constants/app";

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
        config={CHART_CONFIG}
        title="Items over time"
      >
        <p className="flex gap-2 font-medium">
          Total items logged across {yearsLogged} distinct years
        </p>
        <p className="text-muted-foreground">
          Displaying counts of Books, Movies, and TV Shows logged across all
          years.
        </p>
      </ItemCountBarChart>
      <ItemCountBarChart
        config={CHART_CONFIG}
        chartData={chartDataCurrentYear ?? []}
        title={`Items in ${currentYear}`}
      >
        <p className="flex gap-2 font-medium">
          Total items logged in {currentYear}
        </p>
        <p className="text-muted-foreground">
          Displaying counts of Books, Movies, and TV Shows logged this year.
        </p>
      </ItemCountBarChart>
      <div className="lg:col-span-2">
        <CumulativeLineChart
          chartData={chartDataCum ?? []}
          config={CHART_CONFIG}
        />
      </div>
    </div>
  );
}

export default function StatsPage() {
  return (
    <div className="space-y-6">
      <PageHeader>Stats</PageHeader>
      <Suspense fallback={<StatsPageSkeleton />}>
        <StatsContent />
      </Suspense>
    </div>
  );
}
