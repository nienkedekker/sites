import { CategoryList } from "@/components/features/lists/category-list";
import { DataLoadingError } from "@/components/features/error-fallbacks";
import { getItemsForYear } from "@/utils/data/items";
import { CATEGORY_CONFIG } from "@/utils/constants";

/**
 * Server component that fetches and displays items for a given year,
 * grouped by category (Books, Movies, TV Shows).
 */
export default async function ItemsList({ year }: { year: number }) {
  try {
    const itemsResult = await getItemsForYear(year);

    if (!itemsResult.success) {
      return <DataLoadingError error={new Error(itemsResult.error)} />;
    }

    const validatedItems = itemsResult.data;

    const categoryData = CATEGORY_CONFIG.map(({ title, type }) => ({
      title,
      type,
      items: validatedItems.filter((item) => item.itemtype === type),
    }));

    return (
      <div className="space-y-8 sm:space-y-12">
        {/* Category Lists */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 sm:gap-8">
          {categoryData.map(({ title, type, items }) => (
            <CategoryList key={type} categoryTitle={title} items={items} />
          ))}
        </div>
      </div>
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
