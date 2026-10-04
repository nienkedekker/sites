import type { Metadata } from "next";
import PageHeader from "@nienke/ui/page-header";
import { DataLoadingError } from "@/components/features/error-fallbacks";
import { AddUpNext } from "@/components/features/recs/add-up-next";
import {
  byline,
  EntryTitle,
  TypeColumns,
} from "@/components/features/recs/entries";
import { QuietActions } from "@/components/features/recs/quiet-actions";
import { removeWanted } from "@/app/actions/recommendations";
import { getUpNext, type UpNextItem } from "@/utils/data/up-next";
import { createClientForServer } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Up next",
  description: "Books, movies, and TV shows I want to get to next.",
};

export default async function UpNextPage() {
  let upNext: UpNextItem[];
  let signedIn = false;
  const reasons = new Map<string, string>();
  try {
    const supabase = await createClientForServer();
    const [items, { data: auth }] = await Promise.all([
      getUpNext(),
      supabase.auth.getUser(),
    ]);
    upNext = items;
    signedIn = Boolean(auth.user);
    if (signedIn) {
      const { data } = await supabase
        .from("wanted")
        .select("itemtype, external_id, reason");
      for (const row of data ?? []) {
        if (row.reason) {
          reasons.set(`${row.itemtype}|${row.external_id}`, row.reason);
        }
      }
    }
  } catch (error) {
    console.error("Error loading up next:", error);
    return <DataLoadingError error={error as Error} />;
  }

  return (
    <>
      <PageHeader intro="Books, movies, and TV shows to read/watch">
        Up next
      </PageHeader>

      {signedIn && <AddUpNext />}

      {upNext.length > 0 ? (
        <TypeColumns
          entries={upNext}
          noun="item"
          render={(entry) => {
            const reason = reasons.get(
              `${entry.itemtype}|${entry.external_id}`,
            );
            return (
              <>
                <EntryTitle entry={entry} />
                {byline(entry) && (
                  <p className="mt-1 text-sm text-ink-soft">{byline(entry)}</p>
                )}
                {reason && <p className="mt-3 text-sm text-ink">{reason}</p>}
                {signedIn && (
                  <div className="mt-2 flex items-center gap-3 font-mono text-xs text-ink-soft">
                    <QuietActions
                      subject={entry.title}
                      fields={{
                        itemtype: entry.itemtype,
                        externalId: entry.external_id,
                      }}
                      actions={[{ label: "remove", action: removeWanted }]}
                    />
                  </div>
                )}
              </>
            );
          }}
        />
      ) : (
        <p className="border border-dashed border-line-strong p-6 text-ink-soft">
          Nothing up next right now.
        </p>
      )}
    </>
  );
}
