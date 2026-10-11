import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, unstable_rethrow } from "next/navigation";
import { DiscoverHeader } from "@/components/features/discover/discover-header";
import { DataLoadingError } from "@/components/features/error-fallbacks";
import { ItemsListSkeleton } from "@/components/features/skeletons/items-list-skeleton";
import { UpcomingList } from "@/components/features/upcoming/upcoming-list";
import { fetchAllRows } from "@/utils/data/fetch-all";
import { normalizeTitle } from "@/utils/data/patterns";
import { favouriteGenres, type UpcomingBook } from "@/utils/data/upcoming";
import { renderTime } from "@/utils/server/clock";
import { recentBooks } from "@/utils/server/hardcover";
import { hasUpcoming } from "@/utils/server/services";
import { createClientForServer } from "@/utils/supabase/server";

// Hardcover's terms say to keep its data off public pages,
// so this is behind a login
export const metadata: Metadata = {
  title: "New releases",
  robots: { index: false },
};

export default function NewReleasesPage() {
  if (!hasUpcoming()) notFound();
  return (
    <>
      <DiscoverHeader
        current="/discover/new"
        intro="The most read new books of the last two months, and the most anticipated of the next six, from Hardcover."
      />
      <Suspense fallback={<ItemsListSkeleton />}>
        <NewReleases />
      </Suspense>
    </>
  );
}

async function NewReleases() {
  let books: UpcomingBook[];
  let favourites: string[];
  let known: string[];
  let today: string;
  try {
    const supabase = await createClientForServer();
    const [upcoming, logged, wanted, now] = await Promise.all([
      recentBooks(),
      fetchAllRows<{ title: string; genres: string[] }>((from, to) =>
        supabase
          .from("items")
          .select("title, genres")
          .eq("itemtype", "Book")
          .order("id")
          .range(from, to),
      ),
      supabase.from("wanted").select("title").eq("itemtype", "Book"),
      renderTime(),
    ]);
    // Amsterdam's date, so a book counts as out from midnight here
    today = new Date(now).toLocaleDateString("sv-SE", {
      timeZone: "Europe/Amsterdam",
    });
    books = upcoming;
    favourites = favouriteGenres(logged.map((item) => item.genres));
    known = [...logged, ...(wanted.data ?? [])].map((item) =>
      normalizeTitle(item.title),
    );
  } catch (error) {
    unstable_rethrow(error);
    console.error("Error loading recent books:", error);
    return (
      <DataLoadingError
        error={error instanceof Error ? error.message : String(error)}
      />
    );
  }
  return (
    <UpcomingList
      books={books}
      favourites={favourites}
      known={known}
      today={today}
    />
  );
}
