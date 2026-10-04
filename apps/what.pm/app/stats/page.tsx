import { Suspense } from "react";
import { fetchCumulativeCounts } from "@/utils/fetch-stats-data";
import { getStatsData } from "@/utils/data/stats";
import { CumulativeLineChart } from "@/components/features/charts/cumulative-line-chart";
import { EveryEntry } from "@/components/features/stats/every-entry";
import { MostLogged } from "@/components/features/stats/most-logged";
import { genrePath } from "@/utils/data/genres";
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
  // Thrown, not shown, so ISR keeps the last good page instead of the error
  const [stats, cumulative] = await Promise.all([
    getStatsData(),
    fetchCumulativeCounts(),
  ]);

  const busiest = stats.years.reduce((a, b) =>
    b.entries.length > a.entries.length ? b : a,
  );

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
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
            href={genrePath}
          />
        )}
        {stats.genres.screen.length > 0 && (
          <MostLogged
            id="most-watched-genres"
            title="Most watched genres"
            note="movies & TV"
            people={stats.genres.screen}
            href={genrePath}
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
      <div className="lg:col-span-2">
        <CumulativeLineChart chartData={cumulative} config={CHART_CONFIG} />
      </div>
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
