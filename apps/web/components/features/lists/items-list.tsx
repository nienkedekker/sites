import { CategoryList } from "@/components/features/lists/category-list";
import { DataLoadingError } from "@/components/features/error-fallbacks";
import { getItemsForYear } from "@/utils/data/items";

export default async function ItemsList({ year }: { year: number }) {
  try {
    const itemsResult = await getItemsForYear(year);

    if (!itemsResult.success) {
      return <DataLoadingError error={new Error(itemsResult.error)} />;
    }

    const validatedItems = itemsResult.data;

    const categoryData = [
      {
        title: "Books",
        type: "Book" as const,
        items: validatedItems.filter((item) => item.itemtype === "Book"),
      },
      {
        title: "Movies",
        type: "Movie" as const,
        items: validatedItems.filter((item) => item.itemtype === "Movie"),
      },
      {
        title: "TV Shows",
        type: "Show" as const,
        items: validatedItems.filter((item) => item.itemtype === "Show"),
      },
    ];

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
