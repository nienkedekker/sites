import CardHead from "@nienke/ui/card-head";
import { formatCount, formatDate } from "@nienke/ui/format";
import { StatList, StatRow } from "@nienke/ui/stat-list";
import {
  PaceChart,
  type PacePoint,
} from "@/components/features/charts/pace-chart";
import {
  countBy,
  dayOfYear,
  daysInYear,
  typicalBy,
  type PaceYear,
} from "@/utils/data/patterns";
import { localDate } from "@/utils/formatters/date";
import type { TypedItem } from "@/types/shared";

type ItemType = TypedItem["itemtype"];

const STEP = 7;

const TYPES: { type: ItemType; label: string; color: string }[] = [
  { type: "Book", label: "Books", color: "var(--books)" },
  { type: "Movie", label: "Movies", color: "var(--movies)" },
  { type: "Show", label: "TV seasons", color: "var(--shows)" },
];

interface TypePaceProps {
  label: string;
  color: string;
  current: number[];
  // Earlier years with at least one log of this type, so years from before
  // logging it don't drag the typical year down
  past: number[][];
  today: number;
  length: number;
}

function TypePace({
  label,
  color,
  current,
  past,
  today,
  length,
}: TypePaceProps) {
  const soFar = countBy(current, today);
  const typicalNow = Math.round(typicalBy(past, today).mid);
  const typicalYear = Math.round(typicalBy(past, 365).mid);
  const projected = Math.round((soFar / (today + 1)) * length);
  const difference = soFar - typicalNow;

  const points = Array.from({ length: Math.ceil(366 / STEP) + 1 }, (_, i) =>
    Math.min(i * STEP, 365),
  );
  if (!points.includes(today)) points.push(today);
  points.sort((a, b) => a - b);

  const data: PacePoint[] = [...new Set(points)].map((day) => {
    const { low, mid, high } = typicalBy(past, day);
    return {
      day,
      current: day > today ? null : countBy(current, day),
      typical: mid,
      range: [low, high],
    };
  });

  return (
    <div className="flex flex-col">
      <div
        tabIndex={0}
        className="group relative flex w-fit flex-row-reverse items-end gap-3"
      >
        <div className="pb-0.5">
          <h3 className="font-mono text-xs text-ink-soft">{label}</h3>
          <p className="mt-0.5 text-sm text-ink-soft underline decoration-line-strong decoration-dotted underline-offset-4">
            {difference === 0
              ? "level with a typical year"
              : `${formatCount(Math.abs(difference))} ${
                  difference > 0 ? "ahead of" : "behind"
                } a typical year`}
            .
          </p>
        </div>
        <p className="stat-figure text-4xl">{formatCount(soFar)}</p>
        <div className="tooltip">
          <StatList
            rule="bottom"
            className="min-w-44 font-mono [&>*:last-child]:border-b-0"
          >
            <StatRow label="On pace for" className="py-1">
              ~{formatCount(projected)}
            </StatRow>
            <StatRow label="Typical by now" className="py-1">
              {formatCount(typicalNow)}
            </StatRow>
            <StatRow label="Typical year" className="py-1">
              {formatCount(typicalYear)}
            </StatRow>
          </StatList>
        </div>
      </div>

      <div className="mt-3">
        <PaceChart data={data} color={color} />
      </div>
    </div>
  );
}

export function Pace({ years, now }: { years: PaceYear[]; now: Date }) {
  const today = dayOfYear(now);
  const thisYear = localDate(now).year;
  const current = years.find(({ year }) => year === thisYear);
  const earlier = years.filter(({ year }) => year < thisYear);

  if (!current) return null;

  const panels = TYPES.map(({ type, ...rest }) => ({
    ...rest,
    type,
    current: current.days[type],
    past: earlier
      .map(({ days }) => days[type])
      .filter((days) => days.length > 0),
  })).filter(({ past }) => past.length > 0);

  if (panels.length === 0) return null;

  const date = formatDate(now, { month: "long", day: "numeric" });

  return (
    <section aria-labelledby="pace-heading" className="panel">
      <CardHead id="pace-heading" note={`as of ${date}`}>
        Pace
      </CardHead>

      <div className="mt-4 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
        {panels.map(({ type, ...panel }) => (
          <TypePace
            key={type}
            {...panel}
            today={today}
            length={daysInYear(thisYear)}
          />
        ))}
      </div>

      <p
        className="mt-5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.7rem] text-ink-faint"
        aria-hidden="true"
      >
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 bg-ink" />
          {thisYear}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 border-t border-dashed border-ink-faint" />
          typical year (median of earlier years)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 bg-line-strong opacity-40" />
          middle half of earlier years
        </span>
      </p>
    </section>
  );
}
