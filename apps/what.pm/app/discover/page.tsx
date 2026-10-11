import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect, unstable_rethrow } from "next/navigation";
import { DiscoverHeader } from "@/components/features/discover/discover-header";
import { DataLoadingError } from "@/components/features/error-fallbacks";
import { ItemsListSkeleton } from "@/components/features/skeletons/items-list-skeleton";
import { UpcomingList } from "@/components/features/upcoming/upcoming-list";
import { fetchAllRows } from "@/utils/data/fetch-all";
import { titleKey, type UpcomingBook } from "@/utils/data/upcoming";
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
  if (!hasUpcoming()) redirect("/discover/for-you");
  return (
    <>
      <DiscoverHeader current="/discover" />
      <Suspense fallback={<ItemsListSkeleton />}>
        <NewReleases />
      </Suspense>
    </>
  );
}

async function NewReleases() {
  let books: UpcomingBook[];
  let upNext: string[];
  let read: string[];
  let today: string;
  try {
    const supabase = await createClientForServer();
    const [upcoming, logged, wanted, now] = await Promise.all([
      recentBooks(),
      fetchAllRows<{ title: string }>((from, to) =>
        supabase
          .from("items")
          .select("title")
          .eq("itemtype", "Book")
          .order("id")
          .range(from, to),
      ),
      supabase.from("wanted").select("title").eq("itemtype", "Book"),
      renderTime(),
    ]);
    today = new Date(now).toLocaleDateString("sv-SE", {
      timeZone: "Europe/Amsterdam",
    });
    books = upcoming;
    upNext = (wanted.data ?? []).map((item) => titleKey(item.title));
    read = logged.map((item) => titleKey(item.title));
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
    <UpcomingList books={books} upNext={upNext} read={read} today={today} />
  );
}
