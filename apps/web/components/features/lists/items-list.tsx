import { createClientForServer } from "@/utils/supabase/server";
import { CategoryList } from "@/components/features/lists/category-list";
import { DataLoadingError } from "@/components/features/error-fallbacks";

export default async function ItemsList({ year }: { year: number }) {
  let items, user, error;

  try {
    const supabase = await createClientForServer();

    // Fetch all items for the year and user data
    const [itemsResult, userResult] = await Promise.all([
      supabase
        .from("items")
        .select("*")
        .eq("belongs_to_year", year)
        .order("created_at", { ascending: true }),
      supabase.auth.getUser(),
    ]);

    items = itemsResult.data;
    error = itemsResult.error;
    user = userResult.data.user;
  } catch (unexpectedError) {
    console.error("Unexpected error in ItemsList:", unexpectedError);
    return <DataLoadingError error={unexpectedError instanceof Error ? unexpectedError : new Error("Unknown error occurred")} />;
  }

  // Check for any errors
  if (error) {
    console.error("Error fetching items for year", year, ":", error);
    return <DataLoadingError error={error} />;
  }

  // Group items by category
  const allItems = items || [];
  const categoryData = [
    {
      title: "Books",
      type: "Book" as const,
      items: allItems.filter((item) => item.itemtype === "Book"),
    },
    {
      title: "Movies",
      type: "Movie" as const,
      items: allItems.filter((item) => item.itemtype === "Movie"),
    },
    {
      title: "TV Shows",
      type: "Show" as const,
      items: allItems.filter((item) => item.itemtype === "Show"),
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-32 px-6">
      {categoryData.map(({ title, type, items }) => (
        <CategoryList
          key={type}
          categoryTitle={title}
          isLoggedIn={!!user}
          items={items}
        />
      ))}
    </div>
  );
}
