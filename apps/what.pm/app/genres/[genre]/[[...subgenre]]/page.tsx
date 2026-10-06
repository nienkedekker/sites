import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@nienke/ui/page-header";
import { describeCounts } from "@nienke/ui/series";
import { CategoryList } from "@/components/features/lists/category-list";
import { getCachedItems } from "@/utils/data/items";
import { genreParams, genrePath, itemsInGenre } from "@/utils/data/genres";
import { CATEGORY_CONFIG } from "@/utils/constants/app";
import { OG_SIZE } from "@/utils/og";
import type { Metadata } from "next";
import { SITE_NAME } from "@/utils/constants/site";

interface GenreParams {
  params: Promise<{ genre: string; subgenre?: string[] }>;
}

// Unknown genres render on request, before anything is sent, so they get a
// real 404 instead of a not-found page streamed under a 200
export const instant = false;

export async function generateStaticParams() {
  return genreParams(await getCachedItems());
}

async function load({ params }: GenreParams) {
  const { genre, subgenre } = await params;
  if (subgenre && subgenre.length > 1) return null;
  return itemsInGenre(await getCachedItems(), genre, subgenre?.[0]);
}

export async function generateMetadata(props: GenreParams): Promise<Metadata> {
  const found = await load(props);
  if (!found) return {};
  const { genre, subgenre } = await props.params;
  const name = found.subgenre ?? found.genre;
  return {
    title: name,
    description: `Everything I logged as ${name.toLowerCase()}.`,
    // Metadata image files can't sit under a catch-all, so a route draws it
    openGraph: {
      images: [
        {
          url: ["/og/genres", genre, ...(subgenre ?? [])].join("/"),
          ...OG_SIZE,
          alt: `Everything logged as ${name.toLowerCase()} on ${SITE_NAME}`,
        },
      ],
    },
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
