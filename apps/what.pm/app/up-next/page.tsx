import { Suspense } from "react";
import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import PageHeader from "@nienke/ui/page-header";
import { DataLoadingError } from "@/components/features/error-fallbacks";
import { Skeleton } from "@/components/ui/skeleton";
import {
  UpNext,
  type QueueItem,
  type StartingBook,
} from "@/components/features/up-next/up-next";
import { getCachedItems } from "@/utils/data/items";
import { getUpNext } from "@/utils/data/up-next";
import { releaseMonth, startingBooks, titleKey } from "@/utils/data/upcoming";
import { renderTime } from "@/utils/server/clock";
import { coverOf } from "@/utils/server/covers";
import { recentBooks } from "@/utils/server/hardcover";
import { hasUpcoming } from "@/utils/server/services";
import { createClientForServer } from "@/utils/supabase/server";

// Only for me: the page sits behind sign-in, while the lists Radarr, Sonarr and
// the book fetcher read under /api/v1/up-next stay public
export const metadata: Metadata = {
  title: "Up next",
  description: "Books, movies, and TV shows I want to get to next.",
  robots: { index: false },
};

export default function UpNextPage() {
  return (
    <>
      <PageHeader className="mb-6 sm:mb-8">Up next</PageHeader>
      <Suspense fallback={<UpNextSkeleton />}>
        <UpNextQueue />
      </Suspense>
    </>
  );
}

function UpNextSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading up next"
      className="max-w-3xl"
    >
      <Skeleton className="h-[68px] w-full" />
      <div className="mt-15">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 py-4">
            <Skeleton className="h-[130px] w-[90px]" />
            <div className="flex-1">
              <Skeleton className="mb-2 h-5 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// With nothing queued, a few new books from Discover to start with
async function starting(): Promise<StartingBook[]> {
  if (!hasUpcoming()) return [];
  try {
    const [books, logged, now] = await Promise.all([
      recentBooks(),
      getCachedItems(),
      renderTime(),
    ]);
    // Amsterdam's date, as on Discover
    const today = new Date(now).toLocaleDateString("sv-SE", {
      timeZone: "Europe/Amsterdam",
    });
    const read = new Set(
      logged
        .filter((item) => item.itemtype === "Book")
        .map((item) => titleKey(item.title)),
    );
    return startingBooks(books, read, today).map((book) => ({
      id: book.id,
      title: book.title,
      author: book.authors[0] ?? "",
      year: Number(book.releaseDate.slice(0, 4)),
      cover: book.cover?.url ?? null,
      when: releaseMonth(book.releaseDate, today),
    }));
  } catch (error) {
    unstable_rethrow(error);
    console.error("Error loading books to start up next with:", error);
    return [];
  }
}

async function UpNextQueue() {
  let items: QueueItem[];
  let books: StartingBook[] = [];
  try {
    const supabase = await createClientForServer();
    const [upNext, { data: reasons }] = await Promise.all([
      getUpNext(),
      supabase.from("wanted").select("itemtype, external_id, reason"),
    ]);
    const reasonOf = new Map(
      (reasons ?? []).map((row) => [
        `${row.itemtype}|${row.external_id}`,
        row.reason,
      ]),
    );
    items = await Promise.all(
      upNext.map(async (item) => ({
        ...item,
        cover: await coverOf(item),
        reason: reasonOf.get(`${item.itemtype}|${item.external_id}`),
      })),
    );
    if (items.length === 0) books = await starting();
  } catch (error) {
    unstable_rethrow(error);
    console.error("Error loading up next:", error);
    return (
      <DataLoadingError
        error={error instanceof Error ? error.message : String(error)}
      />
    );
  }

  return <UpNext items={items} starting={books} />;
}
