import { CategoryList } from "@/components/features/lists/category-list";
import { DataLoadingError } from "@/components/features/error-fallbacks";
import { getItemsForYear } from "@/utils/data/items";

export default async function ItemsList({ year }: { year: number }) {
  try {
    const itemsResult = await getItemsForYear(year);

    // Handle items result
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

    // Calculate total items for the year
    const totalItems = validatedItems.length;
    const totalBooks =
      categoryData.find((c) => c.type === "Book")?.items.length || 0;
    const totalMovies =
      categoryData.find((c) => c.type === "Movie")?.items.length || 0;
    const totalShows =
      categoryData.find((c) => c.type === "Show")?.items.length || 0;

    return (
      <div className="space-y-12">
        {/* Year Summary */}
        {totalItems > 0 && (
          <div className="flex items-center justify-center md:justify-start gap-8 py-1 text-sm text-slate-400 dark:text-slate-500">
            <span>{totalItems} total</span>
            <span>{totalBooks} books</span>
            <span>{totalMovies} movies</span>
            <span>{totalShows} shows</span>
          </div>
        )}

        {/* Category Lists */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
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
