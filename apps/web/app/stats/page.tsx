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
      <div role="alert" className="card p-6 sm:p-7">
        <p className="text-danger">Unable to load chart data right now.</p>
        <p className="mt-2 text-sm text-ink-soft">
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
    <div className="grid gap-3 lg:grid-cols-2">
      <ItemCountBarChart
        chartData={chartData ?? []}
        config={CHART_CONFIG}
        title="Items over time"
      >
        <p className="font-medium">
          Total items logged across {yearsLogged} distinct years
        </p>
        <p className="text-ink-soft">
          Displaying counts of books, movies, and TV shows logged across all
          years.
        </p>
      </ItemCountBarChart>
      <ItemCountBarChart
        config={CHART_CONFIG}
        chartData={chartDataCurrentYear ?? []}
        title={`Items in ${currentYear}`}
      >
        <p className="font-medium">Total items logged in {currentYear}</p>
        <p className="text-ink-soft">
          Displaying counts of books, movies, and TV shows logged this year.
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
    <div>
      <PageHeader intro="Books, movies and TV seasons, counted across every year.">
        Stats
      </PageHeader>
      <Suspense fallback={<StatsPageSkeleton />}>
        <StatsContent />
      </Suspense>
    </div>
  );
}
