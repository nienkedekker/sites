import { useEffect, useState } from "react";
import CardHead from "@nienke/ui/card-head";
import { externalProps } from "@nienke/ui/external";
import { formatCount, formatDate } from "@nienke/ui/format";
import { StatList, StatRow } from "@nienke/ui/stat-list";
import TagLink from "@nienke/ui/tag-link";
import { barCentre, tooltipAlign } from "@nienke/ui/tooltip";
import { DAY, PROFILE_URL, WEEK, type ListeningStats } from "../lib/lastfm-shared";

const day = (unix: number) =>
  formatDate(new Date(unix * 1000), {
    month: "short",
    day: "numeric",
    timeZone: "Europe/Amsterdam",
  });

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
        tag={stats && <TagLink href={PROFILE_URL}>Since {stats.since}</TagLink>}
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
        <span className="font-medium tabular-nums">{formatCount(latest.count)}</span>
      </div>

      <div
        role="img"
        aria-label={`Scrobbles per week over the last ${weeks.length} weeks, oldest first: ${weeks
          .map((w) => w.count)
          .join(", ")}`}
        className="mt-3 flex h-20 items-end gap-[2px]"
      >
        {weeks.map(({ start, count: n }, i) => (
          <div key={start} className="group relative flex h-full flex-1 items-end">
            <span
              className="w-full bg-books transition-opacity group-hover:opacity-80"
              style={{ height: `${Math.max(2, (n / max) * 100)}%` }}
            />
            <span
              className={`tooltip px-2 py-1 ${tooltipAlign(barCentre(i, weeks.length))}`}
            >
              {day(start)} – {day(start + WEEK - DAY)}:{" "}
              <span className="font-medium tabular-nums">{formatCount(n)}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[0.7rem] text-ink-faint" aria-hidden="true">
        <span>{weeks.length} weeks ago</span>
        <span>last 7 days</span>
      </div>

      <StatList className="mt-5">
        {topArtist && <ArtistRow label="Top this month" artist={topArtist} />}
        {topArtistAllTime && <ArtistRow label="Top all time" artist={topArtistAllTime} />}
      </StatList>
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
    <StatRow label={label}>
      <span className="flex items-baseline justify-end gap-1.5">
        <a href={artist.url} {...externalProps(artist.url)} className="link truncate">
          {artist.name}
        </a>
        <span className="text-ink-faint">
          {formatCount(artist.plays)}
          <span className="sr-only"> plays</span>
        </span>
      </span>
    </StatRow>
  );
}
