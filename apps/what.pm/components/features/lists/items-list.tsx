import type { CSSProperties } from "react";
import CardHead from "@nienke/ui/card-head";
import MediaChart from "@nienke/ui/media-chart";
import PageHeader from "@nienke/ui/page-header";
import { SERIES } from "@nienke/ui/series";
import { CategoryList } from "@/components/features/lists/category-list";
import { getItemsForYear } from "@/utils/data/items";
import { hasMonthlyData, summarizeYear } from "@/utils/data/summary";
import { CATEGORY_CONFIG } from "@/utils/constants/app";
import { TypeBreakdown } from "@/components/features/lists/type-breakdown";
import {
  hasTimeSpent,
  TimeSpent,
} from "@/components/features/lists/time-spent";
import { timeSpent } from "@/utils/data/patterns";
import { renderTime } from "@/utils/server/clock";
import { localDate } from "@/utils/formatters/date";

export default async function ItemsList({ year }: { year: number }) {
  const itemsResult = await getItemsForYear(year);
  // Thrown, not shown, so ISR keeps the last good page instead of the error
  if (!itemsResult.success) throw new Error(itemsResult.error);

  const validatedItems = itemsResult.data;
  const now = new Date(await renderTime());
  const isCurrentYear = year === localDate(now).year;
  const summary = summarizeYear(validatedItems, year);
  const byMonth = hasMonthlyData(validatedItems, year);
  const spent = timeSpent(validatedItems);
  // One type alone has nothing to compare against, so it gets no chart
  const types = SERIES.filter(({ key }) => summary.counts[key] > 0).length;
  const chart = byMonth ? "month" : types > 1 ? "type" : null;

  const categoryData = CATEGORY_CONFIG.map(({ title, type }) => ({
    title,
    type,
    items: validatedItems.filter((item) => item.itemtype === type),
  }));

  return (
    <>
      <PageHeader
        eyebrow={`${validatedItems.length} logged`}
        intro={
          isCurrentYear
            ? "What I’ve read and watched so far this year."
            : `What I read and watched in ${year}.`
        }
      >
        {year}
      </PageHeader>

      {validatedItems.length > 0 && (chart || hasTimeSpent(spent)) && (
        <section
          aria-labelledby="year-chart-heading"
          className="rise panel flex flex-col"
          style={{ "--delay": "240ms" } as CSSProperties}
        >
          <CardHead id="year-chart-heading" className="mb-5">
            {chart === "month"
              ? "Month by month"
              : chart === "type"
                ? "By type"
                : "Time spent"}
          </CardHead>
          {chart === "month" && <MediaChart summary={summary} now={now} />}
          {chart === "type" && <TypeBreakdown counts={summary.counts} />}
          <TimeSpent spent={spent} divided={chart !== null} />
        </section>
      )}

      <div className="mt-20 grid grid-cols-1 gap-16 sm:mt-28 lg:grid-cols-3 lg:gap-10">
        {categoryData.map(({ title, type, items }) => (
          <CategoryList key={type} categoryTitle={title} items={items} />
        ))}
      </div>
    </>
  );
}
