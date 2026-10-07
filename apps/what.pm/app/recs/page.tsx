import { Fragment, Suspense } from "react";
import type { Metadata } from "next";
import { redirect, unstable_rethrow } from "next/navigation";
import { formatDate } from "@nienke/ui/format";
import PageHeader from "@nienke/ui/page-header";
import TagLink from "@nienke/ui/tag-link";
import Link from "next/link";
import { DataLoadingError } from "@/components/features/error-fallbacks";
import { TypeColumnsSkeleton } from "@/components/features/skeletons/type-columns-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import {
  byline,
  EntryTitle,
  TypeColumns,
} from "@/components/features/recs/entries";
import { MadeIt } from "@/components/features/recs/made-it";
import { QuietActions } from "@/components/features/recs/quiet-actions";
import { RefreshPicks } from "@/components/features/recs/refresh-picks";
import {
  dismissRecommendation,
  wantRecommendation,
} from "@/app/actions/recommendations";
import {
  isLogged,
  loggedPicks,
  logIndex,
  type LoggedPick,
} from "@/utils/data/recommend";
import { loadLog } from "@/utils/server/recommend-log";
import { hasRecs } from "@/utils/server/services";
import { createClientForServer } from "@/utils/supabase/server";
import type { Tables } from "@/types";
import type { ValidItemType } from "@/types/shared";

// Refreshing runs as an action in this route's function, and takes a while
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Recommendations",
  robots: { index: false },
};

type Rec = Tables<"recommendations"> & { itemtype: ValidItemType };

const ONE_TYPE: { type: ValidItemType; label: string }[] = [
  { type: "Book", label: "books" },
  { type: "Movie", label: "movies" },
  { type: "Show", label: "shows" },
];

function RecEntry({ rec }: { rec: Rec }) {
  return (
    <article>
      <EntryTitle entry={rec} />
      {byline(rec) && (
        <p className="mt-1 text-sm text-ink-soft">{byline(rec)}</p>
      )}
      <p className="mt-3 text-sm text-ink">{rec.reason}</p>
      {rec.because.length > 0 && (
        <p className="mt-3 flex flex-wrap gap-1.5">
          <span className="sr-only">Because of </span>
          {rec.because.map((title) => (
            <TagLink
              key={title}
              href={`/search?q=${encodeURIComponent(title)}`}
              as={Link}
            >
              {title}
            </TagLink>
          ))}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-ink-soft">
        <QuietActions
          subject={rec.title}
          fields={{
            itemtype: rec.itemtype,
            externalId: rec.external_id,
            title: rec.title,
          }}
          actions={[
            {
              label: rec.itemtype === "Book" ? "want to read" : "want to see",
              action: wantRecommendation,
            },
            {
              label: "not for me",
              action: dismissRecommendation,
              fields: { kind: "not_for_me" },
            },
            {
              label: "seen it",
              action: dismissRecommendation,
              fields: { kind: "seen" },
            },
          ]}
        />
      </div>
    </article>
  );
}

export default function RecsPage() {
  // Picks need Claude; without a key, up next is the closest thing
  if (!hasRecs()) redirect("/up-next");

  return (
    <>
      <PageHeader intro="Picked from the log.">Recommendations</PageHeader>
      <Suspense
        fallback={
          <>
            <Skeleton className="mb-12 h-4 w-72 max-w-full" />
            <TypeColumnsSkeleton label="Loading recommendations" />
          </>
        }
      >
        <Recs />
      </Suspense>
    </>
  );
}

async function Recs() {
  let recs: Rec[];
  let upNextCount: number;
  let madeIt: LoggedPick<Tables<"wanted">>[];
  let saved: number;
  try {
    const supabase = await createClientForServer();
    const [{ data, error }, log] = await Promise.all([
      supabase
        .from("recommendations")
        .select("*")
        .order("score", { ascending: false }),
      loadLog(supabase),
    ]);
    if (error) throw new Error(error.message);
    const index = logIndex(log.items, [...log.dismissed, ...log.wanted]);
    recs = (data as Rec[]).filter((rec) => !isLogged(rec, index));
    const logged = logIndex(log.items);
    upNextCount = log.wanted.filter((item) => !isLogged(item, logged)).length;
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

  // Types can be picked again on their own, so the newest batch says when
  const batchAt = recs.reduce<string | undefined>(
    (newest, rec) => (!newest || rec.batch_at > newest ? rec.batch_at : newest),
    undefined,
  );
  return (
    <>
      <div className="mb-12 font-mono text-xs text-ink-soft">
        {batchAt && (
          <span className="mr-3">
            Picked{" "}
            {formatDate(new Date(batchAt), {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/Amsterdam",
            })}{" "}
            ·
          </span>
        )}
        <RefreshPicks label={batchAt ? "Pick again" : "Pick the first ones"} />
        {batchAt && (
          <span className="ml-3">
            · or just{" "}
            {ONE_TYPE.map(({ type, label }, i) => (
              <Fragment key={type}>
                {i > 0 && ", "}
                <RefreshPicks label={label} itemtype={type} />
              </Fragment>
            ))}
          </span>
        )}
        <span className="ml-3">
          ·{" "}
          <Link href="/up-next" className="link text-ink">
            Up next ({upNextCount})
          </Link>
        </span>
      </div>

      {recs.length > 0 ? (
        <TypeColumns
          entries={recs}
          noun="pick"
          render={(rec) => <RecEntry rec={rec} />}
        />
      ) : (
        <p className="border border-dashed border-line-strong p-6 text-ink-soft">
          {batchAt
            ? "All of these are logged, saved or hidden now. Pick again for new ones."
            : "Nothing picked yet."}
        </p>
      )}

      {madeIt.length > 0 && <MadeIt picks={madeIt} saved={saved} />}
    </>
  );
}
