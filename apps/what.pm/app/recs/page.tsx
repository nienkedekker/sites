import type { Metadata } from "next";
import { externalProps } from "@nienke/ui/external";
import { formatDate, formatPlural } from "@nienke/ui/format";
import PageHeader from "@nienke/ui/page-header";
import { SWATCH } from "@nienke/ui/series";
import TagLink from "@nienke/ui/tag-link";
import Link from "next/link";
import { DataLoadingError } from "@/components/features/error-fallbacks";
import { sourceOf } from "@/components/features/lists/item-source";
import { QuietActions } from "@/components/features/recs/quiet-actions";
import { RefreshPicks } from "@/components/features/recs/refresh-picks";
import {
  dismissRecommendation,
  removeWanted,
  wantRecommendation,
} from "@/app/actions/recommendations";
import { CATEGORY_CONFIG } from "@/utils/constants/app";
import { isLogged, logIndex } from "@/utils/data/recommend";
import { loadLog } from "@/utils/server/recommend-log";
import { createClientForServer } from "@/utils/supabase/server";
import type { Tables } from "@/types";
import type { ValidItemType } from "@/types/shared";

// Refreshing runs as an action in this route's function, and takes a while
export const maxDuration = 300;

export const metadata: Metadata = {
  title: "Recommendations",
  robots: { index: false },
};

type Rec = Tables<"recommendations"> & { itemtype: ValidItemType };
type Wanted = Tables<"wanted"> & { itemtype: ValidItemType };

const linkOf = (
  rec: Pick<Rec, "itemtype" | "external_id" | "title" | "creator">,
) => sourceOf({ ...rec, author: rec.creator })?.href ?? null;

function byline(rec: Pick<Rec, "itemtype" | "creator" | "published_year">) {
  const parts = [
    rec.creator &&
      (rec.itemtype === "Book"
        ? `by ${rec.creator}`
        : rec.itemtype === "Movie"
          ? `dir. ${rec.creator}`
          : `created by ${rec.creator}`),
    rec.published_year,
  ].filter(Boolean);
  return parts.join(" · ");
}

function Pick({ rec }: { rec: Rec }) {
  const href = linkOf(rec);
  return (
    <li>
      <article className="border-b border-line py-5">
        <h3 className="wrap-break-word font-medium leading-snug tracking-[-0.01em] text-ink">
          {href ? (
            <a
              href={href}
              className="underline decoration-transparent underline-offset-4 transition-colors hover:decoration-ink"
              {...externalProps(href)}
            >
              {rec.title}
            </a>
          ) : (
            rec.title
          )}
        </h3>
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
    </li>
  );
}

function WantedRow({ item }: { item: Wanted }) {
  const href = linkOf(item);
  return (
    <li className="flex gap-3 border-b border-line py-4">
      <span
        className={`mt-1.5 size-2.5 shrink-0 ${SWATCH[item.itemtype]}`}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="wrap-break-word font-medium tracking-[-0.01em] text-ink">
          {href ? (
            <a
              href={href}
              className="underline decoration-transparent underline-offset-4 transition-colors hover:decoration-ink"
              {...externalProps(href)}
            >
              {item.title}
            </a>
          ) : (
            item.title
          )}
          {byline(item) && (
            <span className="ml-2 text-sm font-normal text-ink-soft">
              {byline(item)}
            </span>
          )}
        </p>
        {item.reason && (
          <p className="mt-1 text-sm text-ink-soft">{item.reason}</p>
        )}
      </div>
      <div className="flex shrink-0 items-start gap-3 pt-1 font-mono text-xs text-ink-soft">
        <QuietActions
          subject={item.title}
          fields={{ itemtype: item.itemtype, externalId: item.external_id }}
          actions={[{ label: "remove", action: removeWanted }]}
        />
      </div>
    </li>
  );
}

export default async function RecsPage() {
  let recs: Rec[];
  let wanted: Wanted[];
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
    wanted = (log.wanted as Wanted[]).filter((item) => !isLogged(item, logged));
  } catch (error) {
    console.error("Error loading recommendations:", error);
    return <DataLoadingError error={error as Error} />;
  }

  const batchAt = recs[0]?.batch_at;
  const columns = CATEGORY_CONFIG.map(({ title, type }) => ({
    title,
    type,
    recs: recs.filter((rec) => rec.itemtype === type),
  })).filter((column) => column.recs.length > 0);

  return (
    <>
      <PageHeader intro="Picked from the log, where everything counts as liked.">
        Recommendations
      </PageHeader>

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
      </div>

      {columns.length > 0 ? (
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-3 lg:gap-10">
          {columns.map(({ title, type, recs }) => (
            <section key={type} aria-labelledby={`recs-${type}-heading`}>
              <header className="flex items-end justify-between gap-4 border-b border-rule pb-3">
                <h2
                  id={`recs-${type}-heading`}
                  className="display flex items-center gap-3 text-ink text-[1.875rem] sm:text-[2.5rem]"
                >
                  <span
                    className={`size-3 shrink-0 ${SWATCH[type]}`}
                    aria-hidden="true"
                  />
                  {title}
                </h2>
                <p className="pb-1 font-mono text-xs text-ink-soft tabular-nums">
                  {formatPlural(recs.length, "pick")}
                </p>
              </header>
              <ul>
                {recs.map((rec) => (
                  <Pick key={rec.id} rec={rec} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="border border-dashed border-line-strong p-6 text-ink-soft">
          {batchAt
            ? "All of these are logged, saved or hidden now. Pick again for new ones."
            : "Nothing picked yet."}
        </p>
      )}

      {wanted.length > 0 && (
        <section aria-labelledby="wanted-heading" className="mt-24 max-w-3xl">
          <header className="flex items-end justify-between gap-4 border-b border-rule pb-3">
            <h2
              id="wanted-heading"
              className="display text-ink text-[1.875rem] sm:text-[2.5rem]"
            >
              To read &amp; watch
            </h2>
            <p className="pb-1 font-mono text-xs text-ink-soft tabular-nums">
              {formatPlural(wanted.length, "item")}
            </p>
          </header>
          <ul>
            {wanted.map((item) => (
              <WantedRow
                key={`${item.itemtype}|${item.external_id}`}
                item={item}
              />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
