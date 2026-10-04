import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import PageHeader from "@nienke/ui/page-header";
import { describeCounts } from "@nienke/ui/series";
import { CategoryList } from "@/components/features/lists/category-list";
import { getAllItems } from "@/utils/data/items";
import { genrePath, itemsInGenre } from "@/utils/data/genres";
import { CATEGORY_CONFIG, ITEMS_TAG } from "@/utils/constants/app";
import type { Metadata } from "next";

interface GenreParams {
  params: Promise<{ genre: string; subgenre?: string[] }>;
}

const getItems = unstable_cache(getAllItems, ["all-items"], {
  revalidate: 3600,
  tags: [ITEMS_TAG],
});

async function load({ params }: GenreParams) {
  const { genre, subgenre } = await params;
  if (subgenre && subgenre.length > 1) return null;
  return itemsInGenre(await getItems(), genre, subgenre?.[0]);
}

export async function generateMetadata(props: GenreParams): Promise<Metadata> {
  const found = await load(props);
  if (!found) return {};
  const name = found.subgenre ?? found.genre;
  return {
    title: name,
    description: `Everything I logged as ${name.toLowerCase()}.`,
  };
}

const GRID = ["", "max-w-3xl", "lg:grid-cols-2", "lg:grid-cols-3"];

export default async function GenrePage(props: GenreParams) {
  const found = await load(props);
  if (!found) notFound();
  const { genre, subgenre, items } = found;

  const categories = CATEGORY_CONFIG.map(({ title, type }) => ({
    title,
    items: items.filter((item) => item.itemtype === type),
  })).filter((category) => category.items.length > 0);
  const counts = {
    books: items.filter((item) => item.itemtype === "Book").length,
    movies: items.filter((item) => item.itemtype === "Movie").length,
    shows: items.filter((item) => item.itemtype === "Show").length,
  };

  return (
    <>
      <PageHeader
        eyebrow={
          subgenre ? (
            <Link href={genrePath(genre)} className="hover:text-ink">
              {genre}
            </Link>
          ) : (
            "Genre"
          )
        }
        intro={`${describeCounts(counts, { skipZero: true })}, newest first.`}
      >
        {subgenre ?? genre}
      </PageHeader>

      <div
        className={`grid grid-cols-1 gap-16 lg:gap-10 ${GRID[categories.length]}`}
      >
        {categories.map(({ title, items }) => (
          <CategoryList
            key={title}
            categoryTitle={title}
            items={items}
            showYearLink
          />
        ))}
      </div>
    </>
  );
}
