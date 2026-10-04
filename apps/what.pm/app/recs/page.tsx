import type { Metadata } from "next";
import { formatDate } from "@nienke/ui/format";
import PageHeader from "@nienke/ui/page-header";
import TagLink from "@nienke/ui/tag-link";
import Link from "next/link";
import { DataLoadingError } from "@/components/features/error-fallbacks";
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

export default async function RecsPage() {
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
    console.error("Error loading recommendations:", error);
    return <DataLoadingError error={error as Error} />;
  }

  const batchAt = recs[0]?.batch_at;
  return (
    <>
      <PageHeader intro="Picked from the log.">Recommendations</PageHeader>

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
