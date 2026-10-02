import { useEffect, useState } from "react";
import { getSummary, whatpmUrl, type Summary } from "../lib/whatpm";

// Spines in the chart's colours: black, blue, white, grey. Title text reaches
// 4.5:1 on each in both themes. The light spine gets an outline, pulled down
// 1px so at rest its bottom edge is the shelf line.
const SPINES = [
  "bg-books text-paper",
  "bg-movies text-white",
  "bg-panel-2 text-ink border border-line-strong -mb-px",
  "bg-shows text-[#0b0c0e] dark:text-white",
  "bg-books text-paper",
];

// Stable spine height per title, so the shelf doesn't jump between renders
function spineHeight(title: string) {
  const hash = [...title].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return 76 + (hash % 25);
}

// `initial` is fetched while the page is built; the card refreshes it on load
export default function ReadingCard({ initial }: { initial?: Summary }) {
  const [summary, setSummary] = useState<Summary | null>(initial ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getSummary()
      .then(setSummary)
      .catch(() => setFailed(true));
  }, []);

  const books = summary?.recent.books ?? [];
  const logLink = (
    <a
      href={summary?.url ?? whatpmUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
    >
      what.pm
    </a>
  );

  return (
    <div className="flex h-full flex-col gap-6 sm:flex-row">
      {/* Title and tag at the top, like the other cards; the count at the bottom */}
      <div className="flex flex-col sm:w-2/5">
        <div className="flex flex-col items-start gap-2">
          <h3 className="font-medium tracking-[-0.01em]">Reading</h3>
          {summary && (
            <a
              href={summary.url}
              target="_blank"
              rel="noopener noreferrer"
              className="tag whitespace-nowrap"
            >
              {summary.year} <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>

        <div className="mt-auto pt-6">
          {summary || failed ? (
            <p className="text-ink text-7xl leading-none font-semibold tracking-[-0.05em] tabular-nums">
              {summary ? summary.counts.books : "–"}
            </p>
          ) : (
            <div className="h-[4.5rem] w-28 animate-pulse bg-line" />
          )}
          {summary ? (
            <p className="mt-3 text-sm text-ink-soft">books read so far.</p>
          ) : failed ? (
            <p className="mt-3 text-ink-soft">
              Couldn't reach my reading log right now. It lives on {logLink}.
            </p>
          ) : (
            <p className="mt-3 text-ink-faint">Checking my reading log…</p>
          )}
        </div>
      </div>

      {/* The shelf stands on the bottom edge of the card */}
      <div className="flex flex-1 items-end">
        <ul
          className="flex h-44 w-full items-end gap-1.5 border-b border-line-strong px-2"
          aria-label={books.length ? "Most recently finished books" : undefined}
        >
          {books.map((book, i) => {
            return (
              <li
                key={`${book.title}-${book.author}`}
                className={`group relative flex flex-1 cursor-default justify-center py-3 transition-transform duration-300 hover:-translate-y-2 ${SPINES[i % SPINES.length]}`}
                style={{ height: `${spineHeight(book.title)}%` }}
                tabIndex={0}
                aria-label={`${book.title} by ${book.author}${book.reread ? ", a reread" : ""}`}
              >
                {/* Long titles wrap onto a second line down the spine */}
                <span className="max-w-full overflow-hidden text-xs font-medium [writing-mode:vertical-rl]">
                  {book.title}
                </span>
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-48 -translate-x-1/2 border border-line bg-panel px-2.5 py-1.5 text-xs opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                  <span className="block font-medium text-ink">{book.title}</span>
                  <span className="block text-ink-soft">
                    {book.author}
                    {book.reread && <span className="text-ink-faint"> · Reread</span>}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
