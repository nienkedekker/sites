import { useEffect, useState } from "react";
import { externalProps } from "@nienke/ui/external";
import StatTile from "@nienke/ui/stat-tile";
import TagLink from "@nienke/ui/tag-link";
import { barCentre, tooltipAlign } from "@nienke/ui/tooltip";
import { getSummary, whatpmUrl, type Summary } from "../lib/whatpm";

const SPINES = [
  "bg-books text-paper",
  "bg-movies text-white",
  "bg-panel-2 text-ink border border-line-strong -mb-px",
  "bg-shows text-[#0b0c0e] dark:text-white",
  "bg-books text-paper",
];

function spineHeight(title: string) {
  const hash = [...title].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return 76 + (hash % 25);
}

export default function ReadingCard({ initial }: { initial?: Summary }) {
  const [summary, setSummary] = useState<Summary | null>(initial ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getSummary()
      .then(setSummary)
      .catch(() => setFailed(true));
  }, []);

  const books = summary?.recent.books ?? [];
  const logUrl = summary?.url ?? whatpmUrl;
  const logLink = (
    <a href={logUrl} {...externalProps(logUrl)} className="link text-ink">
      what.pm
    </a>
  );

  return (
    <div className="flex h-full flex-col gap-6 sm:flex-row">
      <div className="sm:w-2/5">
        <StatTile
          as="h3"
          title="Reading"
          tag={summary && <TagLink href={summary.url}>{summary.year}</TagLink>}
          size="7xl"
          value={summary ? summary.counts.books : failed ? "–" : null}
        >
          {summary ? (
            "books read so far."
          ) : failed ? (
            <>Couldn't reach my reading log right now. It lives on {logLink}.</>
          ) : (
            <span className="text-ink-faint">Checking my reading log…</span>
          )}
        </StatTile>
      </div>

      <div className="flex flex-1 items-end">
        <ul
          className="flex h-44 w-full items-end gap-1.5 border-b border-line-strong px-2"
          aria-label={books.length ? "Most recent books" : undefined}
        >
          {books.map((book, i) => {
            return (
              <li
                key={i}
                className={`group relative flex flex-1 cursor-default justify-center py-3 transition-transform duration-300 hover:-translate-y-2 ${SPINES[i % SPINES.length]}`}
                style={{ height: `${spineHeight(book.title)}%` }}
                tabIndex={0}
                aria-label={`${book.title} by ${book.author}${book.inProgress ? ", still reading" : ""}${book.reread ? ", a reread" : ""}`}
              >
                <span className="max-w-full overflow-hidden text-xs font-medium [writing-mode:vertical-rl]">
                  {book.title}
                </span>
                <span
                  className={`tooltip max-w-48 px-2.5 py-1.5 group-focus:opacity-100 ${tooltipAlign(barCentre(i, books.length))}`}
                >
                  <span className="block font-medium text-ink">{book.title}</span>
                  <span className="block text-ink-soft">
                    {book.author}
                    {book.inProgress && <span className="text-ink-faint"> · Reading</span>}
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
