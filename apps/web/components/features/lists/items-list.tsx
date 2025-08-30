import { createClientForServer } from "@/utils/supabase/server";
import { CategoryList } from "@/components/features/lists/category-list";

export default async function ItemsList({ year }: { year: number }) {
  const supabase = await createClientForServer();

  // Fetch all items for the year and user data
  const [
    { data: items, error },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase
      .from("items")
      .select("*")
      .eq("belongs_to_year", year)
      .order("created_at", { ascending: true }),
    supabase.auth.getUser(),
  ]);

  // Check for any errors
  if (error) {
    console.error("Error fetching items:", error);
    return (
      <div role="alert" className="text-center p-8">
        <p className="text-red-600">Unable to load your items right now.</p>
        <p className="text-sm text-gray-500 mt-2">
          Please try refreshing the page.
        </p>
      </div>
    );
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
