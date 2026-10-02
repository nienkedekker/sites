import type { CSSProperties } from "react";
import MediaChart from "@nienke/ui/media-chart";
import { CategoryList } from "@/components/features/lists/category-list";
import { DataLoadingError } from "@/components/features/error-fallbacks";
import { PageHeader } from "@/components/ui/page-header";
import { getItemsForYear } from "@/utils/data/items";
import { summarizeYear } from "@/utils/data/summary";
import { CATEGORY_CONFIG } from "@/utils/constants/app";

/**
 * Server component that fetches and displays items for a given year:
 * a month-by-month chart, then the items grouped by category (Books,
 * Movies, TV Shows).
 */
export default async function ItemsList({ year }: { year: number }) {
  try {
    const itemsResult = await getItemsForYear(year);

    if (!itemsResult.success) {
      return <DataLoadingError error={new Error(itemsResult.error)} />;
    }

    const validatedItems = itemsResult.data;
    const isCurrentYear = year === new Date().getFullYear();

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

        <section
          aria-labelledby="month-by-month-heading"
          className="rise card flex flex-col p-6 sm:p-7"
          style={{ "--delay": "240ms" } as CSSProperties}
        >
          <h2
            id="month-by-month-heading"
            className="mb-5 font-medium tracking-[-0.01em]"
          >
            Month by month
          </h2>
          <MediaChart summary={summarizeYear(validatedItems, year)} />
        </section>

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
