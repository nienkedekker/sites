import type { CSSProperties } from "react";
import CardHead from "@nienke/ui/card-head";
import MediaChart from "@nienke/ui/media-chart";
import PageHeader from "@nienke/ui/page-header";
import { CategoryList } from "@/components/features/lists/category-list";
import { DataLoadingError } from "@/components/features/error-fallbacks";
import { getItemsForYear } from "@/utils/data/items";
import { hasMonthlyData, summarizeYear } from "@/utils/data/summary";
import { CATEGORY_CONFIG } from "@/utils/constants/app";
import { TypeBreakdown } from "@/components/features/lists/type-breakdown";

export default async function ItemsList({ year }: { year: number }) {
  try {
    const itemsResult = await getItemsForYear(year);

    if (!itemsResult.success) {
      return <DataLoadingError error={new Error(itemsResult.error)} />;
    }

    const validatedItems = itemsResult.data;
    const isCurrentYear = year === new Date().getFullYear();
    const summary = summarizeYear(validatedItems, year);
    const byMonth = hasMonthlyData(validatedItems, year);

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

        {validatedItems.length > 0 && (
          <section
            aria-labelledby="year-chart-heading"
            className="rise above-grain card flex flex-col p-6 sm:p-7"
            style={{ "--delay": "240ms" } as CSSProperties}
          >
            <CardHead id="year-chart-heading" className="mb-5">
              {byMonth ? "Month by month" : "By type"}
            </CardHead>
            {byMonth ? (
              <MediaChart summary={summary} />
            ) : (
              <TypeBreakdown counts={summary.counts} />
            )}
          </section>
        )}

        <div className="mt-20 grid grid-cols-1 gap-16 sm:mt-28 lg:grid-cols-3 lg:gap-10">
          {categoryData.map(({ title, type, items }) => (
            <CategoryList key={type} categoryTitle={title} items={items} />
          ))}
        </div>
      </>
    );
  } catch (unexpectedError) {
    console.error("Unexpected error in ItemsList:", unexpectedError);
    return (
      <DataLoadingError
        error={
          unexpectedError instanceof Error
            ? unexpectedError
            : new Error("Unknown error occurred")
        }
      />
    );
  }
}
