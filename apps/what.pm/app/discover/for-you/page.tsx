import { Suspense } from "react";
import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import { DiscoverHeader } from "@/components/features/discover/discover-header";
import { DataLoadingError } from "@/components/features/error-fallbacks";
import { MadeIt } from "@/components/features/recs/made-it";
import { UpNext, type QueueItem } from "@/components/features/up-next/up-next";
import {
  ForYou,
  ForYouSkeleton,
  type ForYouPick,
} from "@/components/features/recs/for-you";
import {
  isLogged,
  loggedPicks,
  logIndex,
  type LoggedPick,
} from "@/utils/data/recommend";
import { coverOf } from "@/utils/server/covers";
import { loadLog } from "@/utils/server/recommend-log";
import { hasRecs } from "@/utils/server/services";
import { loadQueue } from "@/utils/server/up-next-queue";
import { createClientForServer } from "@/utils/supabase/server";
import type { Tables } from "@/types";
import type { ValidItemType } from "@/types/shared";

export const metadata: Metadata = {
  title: "For you",
  robots: { index: false },
};

type Rec = Tables<"recommendations"> & { itemtype: ValidItemType };

// Picks from the log, and up next under them: what to get to after that.
// Picks need Claude; without a key, the page is up next alone
export default function ForYouPage() {
  return (
    <>
      <DiscoverHeader
        current="/discover/for-you"
        intro={
          hasRecs()
            ? "Books, films and shows picked from your log."
            : "Books, films and shows to get to next."
        }
      />
      <Suspense fallback={<ForYouSkeleton />}>
        <Recs />
      </Suspense>
    </>
  );
}

async function Recs() {
  let picks: ForYouPick[] | null = null;
  let queue: QueueItem[];
  let logCount = 0;
  let batchAt: string | null = null;
  let madeIt: LoggedPick<Tables<"wanted">>[];
  let saved: number;
  try {
    const supabase = await createClientForServer();
    const [{ data, error }, log, queued] = await Promise.all([
      supabase
        .from("recommendations")
        .select("*")
        .order("score", { ascending: false }),
      loadLog(supabase),
      loadQueue(supabase),
    ]);
    if (error) throw new Error(error.message);
    queue = queued;
    // Picks on up next stay, marked, until the next batch
    const gone = logIndex(log.items, log.dismissed);
    const wanted = new Set(
      log.wanted.map((item) => `${item.itemtype}|${item.external_id}`),
    );
    const recs = hasRecs()
      ? (data as Rec[]).filter((rec) => !isLogged(rec, gone))
      : [];
    const covers = await Promise.all(recs.map(coverOf));
    picks = recs.map((rec, i) => ({
      itemtype: rec.itemtype,
      external_id: rec.external_id,
      title: rec.title,
      creator: rec.creator,
      published_year: rec.published_year,
      reason: rec.reason,
      cover: covers[i],
      upNext: wanted.has(`${rec.itemtype}|${rec.external_id}`),
    }));
    logCount = log.items.length;
    // The newest batch, as types used to be picked on their own
    batchAt =
      (data as Rec[]).reduce<string | null>(
        (newest, rec) =>
          !newest || rec.batch_at > newest ? rec.batch_at : newest,
        null,
      ) ?? null;
    madeIt = loggedPicks(log.wanted, log.items);
    saved = log.wanted.filter((item) => item.reason).length;
  } catch (error) {
    unstable_rethrow(error);
    console.error("Error loading recommendations:", error);
    return (
      <DataLoadingError
        error={error instanceof Error ? error.message : String(error)}
      />
    );
  }

  // Up next first: it's what's already chosen, and its search box is what
  // the page gets opened for most; the picks to choose from follow
  return (
    <>
      <section id="up-next" aria-label="Up next" className="mb-12 scroll-mt-24">
        <UpNext items={queue} />
      </section>
      {hasRecs() && picks && (
        <ForYou picks={picks} logCount={logCount} batchAt={batchAt} />
      )}
      {madeIt.length > 0 && <MadeIt picks={madeIt} saved={saved} />}
    </>
  );
}
