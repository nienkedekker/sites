import { useEffect, useState } from "react";
import CardHead from "@nienke/ui/card-head";
import { PROFILE_URL, WEEK, type ListeningStats } from "../lib/lastfm";

const day = (unix: number) =>
  new Date(unix * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

const count = (n: number) => n.toLocaleString("en-US");

export default function ScrobblesCard({ initial }: { initial?: ListeningStats }) {
  const [stats, setStats] = useState<ListeningStats | null>(initial ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/lastfm")
      .then((res) => {
        if (!res.ok) throw new Error(`Last.fm route responded ${res.status}`);
        return res.json();
      })
      .then(setStats)
      .catch(() => setFailed(true));
  }, []);

  return (
    <div className="flex h-full flex-col">
      <CardHead
        as="h3"
        tag={
          stats && (
            <a
              href={PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="tag whitespace-nowrap"
            >
              Since {stats.since} <span aria-hidden="true">↗</span>
            </a>
          )
        }
      >
        Scrobbles
      </CardHead>

      {stats ? (
        <Stats stats={stats} />
      ) : (
        <p className="mt-auto pt-6 text-sm text-ink-faint">
          {failed ? "Couldn't reach Last.fm right now." : "Counting…"}
        </p>
      )}
    </div>
  );
}

function Stats({ stats }: { stats: ListeningStats }) {
  const { weeks, topArtist, topArtistAllTime } = stats;
  const latest = weeks[weeks.length - 1];
  const max = Math.max(1, ...weeks.map((w) => w.count));

  return (
    <div className="mt-auto pt-6 text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-ink-soft">Per week</span>
        <span className="font-medium tabular-nums">{count(latest.count)}</span>
      </div>

      <div
        role="img"
        aria-label={`Scrobbles per week over the last ${weeks.length} weeks, oldest first: ${weeks
          .map((w) => w.count)
          .join(", ")}`}
        className="mt-3 flex h-20 items-end gap-[2px]"
      >
        {weeks.map(({ start, count: n }) => (
          <div key={start} className="group relative flex h-full flex-1 items-end">
            <span
              className="w-full bg-books transition-opacity group-hover:opacity-80"
              style={{ height: `${Math.max(2, (n / max) * 100)}%` }}
            />
            <span className="tooltip left-1/2 -translate-x-1/2 px-2 py-1">
              {day(start)} – {day(start + WEEK - 1)}:{" "}
              <span className="font-medium tabular-nums">{count(n)}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[0.7rem] text-ink-faint" aria-hidden="true">
        <span>{weeks.length} weeks ago</span>
        <span>last 7 days</span>
      </div>

      <dl className="mt-5">
        {topArtist && <ArtistRow label="Top this month" artist={topArtist} />}
        {topArtistAllTime && <ArtistRow label="Top all time" artist={topArtistAllTime} />}
      </dl>
    </div>
  );
}

function ArtistRow({
  label,
  artist,
}: {
  label: string;
  artist: NonNullable<ListeningStats["topArtist"]>;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-line py-2">
      <dt className="shrink-0 text-ink-soft">{label}</dt>
      <dd className="flex min-w-0 items-baseline gap-1.5">
        <a
          href={artist.url}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate underline decoration-line-strong underline-offset-4 hover:decoration-ink"
        >
          {artist.name}
        </a>
        <span className="text-ink-faint tabular-nums">
          {count(artist.plays)}
          <span className="sr-only"> plays</span>
        </span>
      </dd>
    </div>
  );
}
