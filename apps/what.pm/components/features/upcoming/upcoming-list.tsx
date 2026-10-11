"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { externalProps } from "@nienke/ui/external";
import { formatPlural } from "@nienke/ui/format";
import Tag from "@nienke/ui/tag";
import { QuietActions } from "@/components/features/recs/quiet-actions";
import { addUpcomingToUpNext } from "@/app/actions/upcoming";
import {
  byMonth,
  genresOf,
  isOut,
  matchesGenres,
  titleKey,
  type UpcomingBook,
} from "@/utils/data/upcoming";

// Release dates are calendar days, so read them in UTC to keep the day
const day = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  });

// "Oct", or "Jan 2027" for a month in another year than today's
const monthShort = (month: string, today: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    month: "short",
    ...(month.slice(0, 4) === today.slice(0, 4) ? {} : { year: "numeric" }),
  });

const monthName = (month: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  });

function Cover({ book }: { book: UpcomingBook }) {
  if (!book.cover) {
    return (
      <div
        className="aspect-2/3 w-20 shrink-0 border border-line bg-panel sm:w-24"
        aria-hidden="true"
      />
    );
  }
  return (
    <Image
      src={book.cover.url}
      width={book.cover.width}
      height={book.cover.height}
      sizes="96px"
      alt=""
      className="h-auto w-20 shrink-0 self-start border border-line sm:w-24"
    />
  );
}

type Status = "up-next" | "read" | null;

function BookRow({
  book,
  status,
  out,
}: {
  book: UpcomingBook;
  status: Status;
  out: boolean;
}) {
  // Marked straight away, before the page has refreshed with up next
  const [added, setAdded] = useState(false);
  const shown = added ? "up-next" : status;
  const href = book.slug ? `https://hardcover.app/books/${book.slug}` : null;
  const author = book.authors.join(", ");
  return (
    // Books already on up next or read fade back, so the rest stand out while
    // scrolling; hovering or tabbing in brings one back to full strength
    <article
      className={`flex gap-4 border-t border-line py-5 transition-opacity first:border-t-0 sm:gap-5 ${shown ? "opacity-45 hover:opacity-100 focus-within:opacity-100" : ""}`}
    >
      <Cover book={book} />
      <div className="min-w-0 flex-1">
        <h3 className="wrap-break-word font-medium leading-snug tracking-[-0.01em] text-ink">
          {href ? (
            <a
              href={href}
              className="underline decoration-transparent underline-offset-4 transition-colors hover:decoration-ink"
              {...externalProps(href)}
            >
              {book.title}
            </a>
          ) : (
            book.title
          )}
        </h3>
        <p className="mt-1 text-sm text-ink-soft">
          {author && `by ${author} · `}
          {out ? (
            `out ${day(book.releaseDate)}`
          ) : (
            <span className="font-medium text-ink">
              Not out yet: {day(book.releaseDate)}
            </span>
          )}
        </p>
        {book.genres.length > 0 && (
          <p className="mt-2 flex flex-wrap gap-1.5">
            {book.genres.map((genre) => (
              <Tag key={genre}>{genre}</Tag>
            ))}
          </p>
        )}
        {book.description && (
          <p className="mt-3 line-clamp-3 text-sm text-ink">
            {book.description}
          </p>
        )}
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-ink-faint">
          <span>
            {formatPlural(book.readers, "reader")}{" "}
            {out ? "on Hardcover" : "waiting"}
          </span>
          {shown === "up-next" ? (
            <Link href="/up-next" className="link text-ink hover:text-ink">
              ✓ On up next
            </Link>
          ) : shown === "read" ? (
            <span>Read</span>
          ) : (
            <QuietActions
              subject={book.title}
              fields={{
                title: book.title,
                author: book.authors[0] ?? "",
                year: book.releaseDate.slice(0, 4),
              }}
              actions={[
                {
                  label: "Put on up next",
                  action: async (formData) => {
                    const result = await addUpcomingToUpNext(formData);
                    if (!result.error) setAdded(true);
                    return result;
                  },
                },
              ]}
            />
          )}
        </p>
      </div>
    </article>
  );
}

interface Props {
  books: UpcomingBook[];
  // Title keys of books on up next, and of books in the log
  upNext: string[];
  read: string[];
  // YYYY-MM-DD in Amsterdam: books released by then are out
  today: string;
}

type Part = "out" | "coming";

// A month's anchor: a month can be in both parts, out before today and
// coming after it
const anchor = (part: Part, month: string) => `${part}-${month}`;

function Months({
  part,
  books,
  newestFirst,
  statusOf,
  today,
}: {
  part: Part;
  books: UpcomingBook[];
  newestFirst: boolean;
  statusOf: (book: UpcomingBook) => Status;
  today: string;
}) {
  return (
    <div className="space-y-14">
      {byMonth(books, newestFirst).map(({ month, books }) => (
        <section
          key={month}
          id={anchor(part, month)}
          data-month
          aria-labelledby={`${anchor(part, month)}-heading`}
          // Clear of the site header and the month bar when jumped to
          className="scroll-mt-32"
        >
          <header className="flex items-end justify-between gap-4 border-b border-rule pb-3">
            <h3
              id={`${anchor(part, month)}-heading`}
              className="display text-ink text-[1.875rem] sm:text-[2.5rem]"
            >
              {monthName(month)}
            </h3>
            <p className="font-mono text-xs text-ink-faint">
              {formatPlural(books.length, "book")}
            </p>
          </header>
          <div className="max-w-3xl">
            {books.map((book) => (
              <BookRow
                key={book.id}
                book={book}
                status={statusOf(book)}
                out={isOut(book, today)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

interface BarPart {
  part: Part;
  title: string;
  months: string[];
}

// Under the site header as the page scrolls: every month, to jump to, with the
// one in view marked. Sideways scrolling on a phone keeps it to one line
function MonthBar({ parts, today }: { parts: BarPart[]; today: string }) {
  const [active, setActive] = useState<string | null>(null);
  const barRef = useRef<HTMLElement>(null);
  // Changes only when the months shown change, as a genre is picked
  const shownMonths = parts
    .flatMap(({ part, months }) => months.map((month) => anchor(part, month)))
    .join(" ");

  // The month in view is the last one whose top has passed under the bar
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const sections = document.querySelectorAll<HTMLElement>("[data-month]");
      let current: string | null = sections[0]?.id ?? null;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= 160) current = section.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [shownMonths]);

  // Keep the marked month in sight in the bar itself
  useEffect(() => {
    if (!active) return;
    barRef.current
      ?.querySelector<HTMLElement>(`[data-target="${active}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  const jump = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "instant", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <nav
      ref={barRef}
      aria-label="Months"
      className="sticky top-14 z-10 -mx-4 mb-10 overflow-x-auto border-b border-rule bg-paper/90 px-4 backdrop-blur"
    >
      <div className="flex w-max items-center gap-x-1 py-2 font-mono text-xs">
        {parts.map(({ part, title, months }, i) => (
          <div key={part} className="flex items-center gap-x-1">
            {i > 0 && (
              <span className="mx-2 h-4 w-px bg-rule" aria-hidden="true" />
            )}
            <span className="pr-1 uppercase tracking-[0.06em] text-ink-faint">
              {title}
            </span>
            {months.map((month) => {
              const id = anchor(part, month);
              return (
                <a
                  key={id}
                  href={`#${id}`}
                  data-target={id}
                  aria-current={active === id ? "true" : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    jump(id);
                  }}
                  className="whitespace-nowrap px-2 py-1 text-ink-soft hover:text-ink aria-[current=true]:bg-ink aria-[current=true]:text-paper"
                >
                  {monthShort(month, today)}
                </a>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}

export function UpcomingList({ books, upNext, read, today }: Props) {
  const genres = genresOf(books);
  // Everything to start with; a genre narrows it down
  const [picked, setPicked] = useState(() => new Set<string>());
  const onUpNext = new Set(upNext);
  const inLog = new Set(read);
  const statusOf = (book: UpcomingBook): Status => {
    const key = titleKey(book.title);
    return onUpNext.has(key) ? "up-next" : inLog.has(key) ? "read" : null;
  };
  const shown = books.filter((book) => matchesGenres(book, picked));
  const out = shown.filter((book) => isOut(book, today));
  const coming = shown.filter((book) => !isOut(book, today));
  const parts = [
    {
      part: "out" as const,
      title: "Out now",
      note: "the last two months, newest first",
      books: out,
      newestFirst: true,
    },
    {
      part: "coming" as const,
      title: "Coming soon",
      note: "the next six months",
      books: coming,
      newestFirst: false,
    },
  ].filter(({ books }) => books.length > 0);

  const toggle = (genre: string) =>
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(genre)) next.delete(genre);
      else next.add(genre);
      return next;
    });

  return (
    <div>
      <div
        role="group"
        aria-label="Genres"
        className="mb-10 flex flex-wrap items-center gap-2"
      >
        <button
          type="button"
          onClick={() => setPicked(new Set())}
          aria-pressed={picked.size === 0}
          className="tag cursor-pointer aria-pressed:bg-ink aria-pressed:text-paper"
        >
          All
        </button>
        {genres.map((genre) => (
          <button
            key={genre}
            type="button"
            onClick={() => toggle(genre)}
            aria-pressed={picked.has(genre)}
            className="tag cursor-pointer aria-pressed:bg-ink aria-pressed:text-paper"
          >
            {genre}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-ink-soft">Nothing new in these genres.</p>
      ) : (
        <div className="space-y-20">
          <MonthBar
            today={today}
            parts={parts.map(({ part, title, books, newestFirst }) => ({
              part,
              title,
              months: byMonth(books, newestFirst).map(({ month }) => month),
            }))}
          />
          {parts.map((part) => (
            <section key={part.title} aria-label={part.title}>
              <h2 className="mb-8 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="tag">{part.title}</span>
                <span className="font-mono text-xs text-ink-faint">
                  {part.note}
                </span>
              </h2>
              <Months
                part={part.part}
                books={part.books}
                newestFirst={part.newestFirst}
                statusOf={statusOf}
                today={today}
              />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
