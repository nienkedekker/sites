import { Suspense } from "react";
import { fetchCumulativeCounts } from "@/utils/fetch-stats-data";
import { getStatsData } from "@/utils/data/stats";
import { CumulativeLineChart } from "@/components/features/charts/cumulative-line-chart";
import { EveryEntry } from "@/components/features/stats/every-entry";
import { MostLogged } from "@/components/features/stats/most-logged";
import { MonthHeatmap } from "@/components/features/stats/month-heatmap";
import { StatTile } from "@/components/features/stats/stat-tile";
import { MostReread } from "@/components/features/stats/most-reread";
import { Pace } from "@/components/features/stats/pace";
import { RereadRhythm } from "@/components/features/stats/reread-rhythm";
import { Adaptations } from "@/components/features/stats/adaptations";
import { StatsPageSkeleton } from "@/components/features/skeletons/stats-skeleton";
import PageHeader from "@nienke/ui/page-header";
import { CHART_CONFIG } from "@/utils/constants/app";

async function StatsContent() {
  const [stats, cumulative] = await Promise.all([
    getStatsData().catch((error) => {
      console.error("Error building stats:", error);
      return null;
    }),
    fetchCumulativeCounts(),
  ]);

  if (!stats && !cumulative) {
    return (
      <div role="alert" className="panel">
        <p className="text-danger">Unable to load chart data right now.</p>
        <p className="mt-2 text-sm text-ink-soft">
          Please try refreshing the page.
        </p>
      </div>
    );
  }

  const busiest = stats?.years.reduce((a, b) =>
    b.entries.length > a.entries.length ? b : a,
  );

  const total = cumulative && (
    <div className="lg:col-span-2">
      <CumulativeLineChart chartData={cumulative} config={CHART_CONFIG} />
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {stats && (
        <>
          <div className="contents lg:flex lg:flex-col lg:gap-3">
            <EveryEntry years={stats.years} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-5 lg:flex-1">
              {busiest && (
                <div className="sm:col-span-2">
                  <StatTile
                    title="Busiest year"
                    value={busiest.entries.length}
                    tag={String(busiest.year)}
                    href={`/year/${busiest.year}`}
                  >
                    things logged in one year.
                  </StatTile>
                </div>
              )}
              {stats.mostReread.length > 0 && (
                <div className="sm:col-span-3">
                  <MostReread titles={stats.mostReread} />
                </div>
              )}
            </div>
          </div>
          <div className="contents lg:flex lg:flex-col lg:gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MostLogged
                id="most-logged-authors"
                title="Most logged authors"
                people={stats.authors}
              />
              <MostLogged
                id="most-logged-directors"
                title="Most logged directors"
                people={stats.directors}
              />
            </div>
            {stats.monthRows.length > 0 && (
              <div className="lg:flex-1 [&>section]:h-full">
                <MonthHeatmap rows={stats.monthRows} />
              </div>
            )}
          </div>
          {stats.pace.length > 0 && (
            <div className="lg:col-span-2">
              <Pace years={stats.pace} />
            </div>
          )}
          {/* Each genre card keeps its own height, so opening the subgenres of
              one doesn't stretch the other */}
          <div className="grid grid-cols-1 items-start gap-3 lg:col-span-2 lg:grid-cols-2">
            {stats.genres.books.length > 0 && (
              <MostLogged
                id="most-read-genres"
                title="Most read genres"
                people={stats.genres.books}
                linked={false}
              />
            )}
            {stats.genres.screen.length > 0 && (
              <MostLogged
                id="most-watched-genres"
                title="Most watched genres"
                note="movies & TV"
                people={stats.genres.screen}
                linked={false}
              />
            )}
          </div>
          {stats.rhythms.length > 0 && (
            <div className="lg:col-span-2">
              <RereadRhythm rhythms={stats.rhythms} />
            </div>
          )}
          {stats.adaptations.length > 0 && (
            <div className="lg:col-span-2">
              <Adaptations pairs={stats.adaptations} />
            </div>
          )}
        </>
      )}
      {total}
    </div>
  );
}

export default function StatsPage() {
  return (
    <div>
      <PageHeader intro="Books, movies and TV seasons over the years">
        Stats
      </PageHeader>
      <Suspense fallback={<StatsPageSkeleton />}>
        <StatsContent />
      </Suspense>
    </div>
  );
}
