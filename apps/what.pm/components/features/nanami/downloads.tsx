"use client";

import Meter from "@nienke/ui/meter";
import Panel from "@nienke/ui/panel";
import Tag from "@nienke/ui/tag";
import {
  isInProgress,
  STATE_LABEL,
  summarize,
  type Download,
  type DownloadState,
  type StoredReport,
} from "@/utils/data/nanami";
import {
  clock,
  Headline,
  Light,
  useReport,
  type Lit,
} from "@/components/features/nanami/live";

const STATE_LIGHT: Record<DownloadState, Lit> = {
  downloading: "ok",
  processing: "ok",
  queued: "unknown",
  waiting: "unknown",
  paused: "warn",
  failed: "down",
};

function DownloadRow({ item }: { item: Download }) {
  return (
    <li className="flex gap-2.5 border-t border-line py-3 first:border-t-0">
      <Light status={STATE_LIGHT[item.state]} label={STATE_LABEL[item.state]} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium [overflow-wrap:anywhere]">
            {item.title}
          </p>
          <Tag>{item.kind}</Tag>
        </div>
        {item.progress !== undefined && (
          <div className="mt-2 flex items-center gap-3">
            <Meter
              value={item.progress}
              fill={item.state === "downloading" ? "bg-accent" : "bg-ink-faint"}
              className="flex-1"
            />
            <span className="w-10 text-right font-mono text-xs text-ink-soft tabular-nums">
              {Math.floor(item.progress)}%
            </span>
          </div>
        )}
        <p className="mt-1 font-mono text-xs text-ink-faint [overflow-wrap:anywhere]">
          {!["processing", "waiting"].includes(item.state) &&
            `${STATE_LABEL[item.state]}. `}
          {item.detail}
        </p>
      </div>
    </li>
  );
}

interface Props {
  initial: StoredReport | null;
  renderedAt: number;
}

export default function NanamiDownloads({ initial, renderedAt }: Props) {
  const { report, now, stale } = useReport(initial, renderedAt);
  const downloads = report?.downloads;
  const items = downloads?.items ?? [];
  const inProgress = items.filter(isInProgress);
  const waiting = items.filter((item) => !isInProgress(item));
  const finished = downloads?.finished ?? [];
  const needsLook = inProgress.some(({ state }) =>
    ["paused", "failed"].includes(state),
  );
  const note = stale ? "from the last report" : undefined;

  return (
    <div className="space-y-6">
      <Headline
        report={report}
        stale={stale}
        now={now}
        status={needsLook ? "warn" : "ok"}
      >
        {downloads
          ? summarize(items)
          : "This report says nothing about downloads"}
      </Headline>

      {downloads && (
        <>
          <Panel
            as="h3"
            id="in-progress-heading"
            title="In progress"
            note={note}
          >
            {inProgress.length ? (
              <ul>
                {inProgress.map((item, i) => (
                  <DownloadRow key={`${item.title}-${i}`} item={item} />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-soft">
                Nothing is downloading right now.
              </p>
            )}
          </Panel>

          <div className="grid gap-6 md:grid-cols-2">
            <Panel
              as="h3"
              id="not-found-yet-heading"
              title="Not found yet"
              note={note}
            >
              {waiting.length ? (
                <ul>
                  {waiting.map((item, i) => (
                    <DownloadRow key={`${item.title}-${i}`} item={item} />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-soft">
                  Everything on up next has been found.
                </p>
              )}
            </Panel>

            <Panel
              as="h3"
              id="recently-added-heading"
              title="Recently added"
              note={note}
            >
              {finished.length ? (
                <ul>
                  {finished.map((item, i) => (
                    <li
                      key={`${item.title}-${i}`}
                      className="flex items-baseline gap-3 border-t border-line py-2.5 text-sm first:border-t-0"
                    >
                      <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                        {item.title}
                      </span>
                      <Tag>{item.kind}</Tag>
                      <span className="w-20 shrink-0 text-right font-mono text-xs text-ink-faint tabular-nums">
                        {clock(item.at)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-soft">
                  Nothing in the last week.
                </p>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
