import Link from "next/link";
import CardHead from "@nienke/ui/card-head";
import { normalizeTitle, type Adaptation } from "@/utils/data/patterns";

const SHOWN = 14;

interface Row {
  title: string;
  suffix: string | null;
  read: number;
  watched: number;
  wait: number;
}

// "Dune: Part One" under "Dune" becomes "Part One"; two numbered parts
// become "Parts 1 & 2"
function suffixFor(book: string, screens: string[]) {
  const extras = screens
    .filter((title) => normalizeTitle(title) !== normalizeTitle(book))
    .map((title) =>
      title.toLowerCase().startsWith(book.toLowerCase())
        ? title.slice(book.length).replace(/^[\s:–—-]+/, "")
        : title,
    );
  if (extras.length === 0) return null;
  const numbered = extras.map((extra) => extra.match(/^Part (\d+)$/)?.[1]);
  if (extras.length > 1 && numbered.every(Boolean)) {
    return `Parts ${numbered.join(" & ")}`;
  }
  return extras.join(", ");
}

// One row per book, timed from the first adaptation I watched. Pairs where
// the first read or watch happened before I started logging are left out,
// since that wait is unknown.
function longestWaits(pairs: Adaptation[]): Row[] {
  const byBook = new Map<string, Adaptation[]>();
  for (const pair of pairs) {
    if (pair.book.before || pair.screen.before) continue;
    const key = `${pair.book.title}|${pair.book.author}`;
    byBook.set(key, [...(byBook.get(key) ?? []), pair]);
  }
  return [...byBook.values()]
    .map((group) => {
      const sorted = [...group].sort((a, b) => a.screen.year - b.screen.year);
      const [first] = sorted;
      return {
        title: first.book.title,
        suffix: suffixFor(
          first.book.title,
          sorted.map((pair) => pair.screen.title),
        ),
        read: first.book.year,
        watched: first.screen.year,
        wait: first.screen.year - first.book.year,
      };
    })
    .sort(
      (a, b) =>
        Math.abs(b.wait) - Math.abs(a.wait) || a.title.localeCompare(b.title),
    )
    .slice(0, SHOWN);
}

const head = "pb-2 font-mono text-xs font-normal text-ink-faint";
const year = "py-3 text-right font-mono text-sm text-ink-soft tabular-nums";

function Table({ rows, longest }: { rows: Row[]; longest: number }) {
  return (
    <table className="w-full table-fixed border-collapse">
      <thead>
        <tr className="border-b border-rule">
          <th scope="col" className={`${head} text-left`}>
            book
          </th>
          <th scope="col" className={`${head} w-14 text-right`}>
            read
          </th>
          <th scope="col" className={`${head} w-16 text-right`}>
            watched
          </th>
          <th scope="col" className={`${head} w-28 pl-6 text-left`}>
            wait
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.title} className="border-b border-line last:border-b-0">
            <th
              scope="row"
              className="truncate py-3 text-left text-sm font-normal"
            >
              <Link
                href={`/search?q=${encodeURIComponent(row.title)}`}
                className="link text-ink"
              >
                {row.title}
              </Link>
              {row.suffix && (
                <span className="ml-2 text-ink-faint">{row.suffix}</span>
              )}
            </th>
            <td className={year}>{row.read}</td>
            <td className={year}>{row.watched}</td>
            <td className="py-3 pl-6">
              <span className="flex items-center gap-3 font-mono text-sm tabular-nums">
                <span
                  className="h-1.5 bg-ink"
                  style={{ width: `${(Math.abs(row.wait) / longest) * 60}%` }}
                  aria-hidden="true"
                />
                <span>
                  {row.wait}
                  <span className="sr-only"> years</span>
                </span>
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Adaptations({ pairs }: { pairs: Adaptation[] }) {
  const rows = longestWaits(pairs);
  const longest = Math.max(1, ...rows.map((row) => Math.abs(row.wait)));
  const half = Math.ceil(rows.length / 2);

  return (
    <section
      aria-labelledby="adaptations-heading"
      className="above-grain card p-6 sm:p-7"
    >
      <CardHead id="adaptations-heading" note="longest waits">
        Page to screen
      </CardHead>

      <div className="mt-6 grid gap-x-10 gap-y-6 lg:grid-cols-2">
        <Table rows={rows.slice(0, half)} longest={longest} />
        {rows.length > half && (
          <Table rows={rows.slice(half)} longest={longest} />
        )}
      </div>
    </section>
  );
}
