import { createClientForServer } from "@/utils/supabase/server";
import { CategoryList } from "@/components/lists/category-list";

export default async function ItemsList({ year }: { year: number }) {
  const supabase = await createClientForServer();

  const categories = [
    { title: "Books", type: "Book" },
    { title: "Movies", type: "Movie" },
    { title: "TV Shows", type: "Show" },
  ];

  // Fetch items for each category in parallel with database-level filtering
  const [
    { data: books, error: booksError },
    { data: movies, error: moviesError },
    { data: shows, error: showsError },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase
      .from("items")
      .select(
        "id, title, author, itemtype, published_year, belongs_to_year, redo, created_at",
      )
      .eq("belongs_to_year", year)
      .eq("itemtype", "Book")
      .order("created_at", { ascending: true }),
    supabase
      .from("items")
      .select(
        "id, title, director, itemtype, published_year, belongs_to_year, redo, created_at",
      )
      .eq("belongs_to_year", year)
      .eq("itemtype", "Movie")
      .order("created_at", { ascending: true }),
    supabase
      .from("items")
      .select(
        "id, title, season, itemtype, published_year, belongs_to_year, redo, created_at",
      )
      .eq("belongs_to_year", year)
      .eq("itemtype", "Show")
      .order("created_at", { ascending: true }),
    supabase.auth.getUser(),
  ]);

  // Check for any errors
  if (booksError || moviesError || showsError) {
    console.error("Error fetching items:", {
      booksError,
      moviesError,
      showsError,
    });
    return (
      <div role="alert" className="text-center p-8">
        <p className="text-red-600">Unable to load your items right now.</p>
        <p className="text-sm text-gray-500 mt-2">
          Please try refreshing the page.
        </p>
      </div>
    );
  }

  // Map categories to their respective data
  const categoryData = [
    { title: "Books", type: "Book", items: books || [] },
    { title: "Movies", type: "Movie", items: movies || [] },
    { title: "TV Shows", type: "Show", items: shows || [] },
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
