"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { externalProps } from "@nienke/ui/external";
import { formatPlural } from "@nienke/ui/format";
import { QuietActions } from "@/components/features/recs/quiet-actions";
import { addUpcomingToUpNext } from "@/app/actions/upcoming";
import { GenreMenu } from "@/components/features/upcoming/genre-menu";
import {
  byMonth,
  genresOf,
  isOut,
  matchesGenres,
  titleKey,
  type Run,
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

// "Oct", or "Jan '27" where the year turns
const monthShort = (month: string, previous: string) => {
  const name = new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    month: "short",
  });
  return month.slice(0, 4) === previous.slice(0, 4)
    ? name
    : `${name} '${month.slice(2, 4)}`;
};

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

// Three lines, and "Read more" when there's more than fits in them
function Description({ runs }: { runs: Run[] }) {
  const [open, setOpen] = useState(false);
  const [cut, setCut] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  // Whether the clamp hides anything depends on the width, so it's measured,
  // and measured again when the column changes size
  useEffect(() => {
    const element = ref.current;
    if (!element || open) return;
    const measure = () =>
      setCut(element.scrollHeight > element.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [open]);

  return (
    <div className="mt-3">
      <p
        ref={ref}
        className={`text-sm whitespace-pre-line text-ink ${open ? "" : "line-clamp-3"}`}
      >
        {runs.map((run, i) =>
          run.italic || run.bold ? (
            <span
              key={i}
              className={`${run.italic ? "italic" : ""} ${run.bold ? "font-semibold" : ""}`}
            >
              {run.text}
            </span>
          ) : (
            run.text
          ),
        )}
      </p>
      {(cut || open) && (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="link mt-1 cursor-pointer font-mono text-xs text-ink-soft hover:text-ink"
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

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
          {book.genres.length > 0 && (
            <>
              {" · "}
              <span className="font-mono text-xs">
                {book.genres.join(", ")}
              </span>
            </>
          )}
        </p>
        {book.description && <Description runs={book.description} />}
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

// Where a month's books start, under the site header and the filter bar. The
// month in view is the first one crossing the band from here down
const BAND_TOP = 100;

const anchor = (month: string) => `month-${month}`;

// The address with its query changed, keeping what else is in it
function withParams(change: (params: URLSearchParams) => void) {
  const params = new URLSearchParams(location.search);
  change(params);
  return params.size ? `?${params}` : location.pathname;
}

function MonthSection({
  month,
  books,
  statusOf,
  today,
}: {
  month: string;
  books: UpcomingBook[];
  statusOf: (book: UpcomingBook) => Status;
  today: string;
}) {
  const out = books.filter((book) => isOut(book, today)).length;
  const when =
    out === books.length
      ? "out now"
      : out === 0
        ? "coming soon"
        : "out now + coming";
  return (
    <section
      id={anchor(month)}
      data-month={month}
      aria-labelledby={`${anchor(month)}-heading`}
      // Clear of the site header and the filter bar when jumped to
      className="scroll-mt-28"
    >
      <header className="flex items-end justify-between gap-4 border-b border-rule pb-3">
        <h2
          id={`${anchor(month)}-heading`}
          className="display text-ink text-[1.875rem] sm:text-[2.5rem]"
        >
          {monthName(month)}
        </h2>
        <p className="font-mono text-xs text-ink-faint">
          {formatPlural(books.length, "book")} · {when}
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
  );
}

// Under the site header as the page scrolls: the genre, every month from the
// oldest out to the last coming, and the way back up. On a phone the months
// scroll sideways, with the genre and Top staying put
function FilterBar({
  genreMenu,
  months,
  shown,
  active,
  currentMonth,
  hrefFor,
  onJump,
}: {
  genreMenu: ReactNode;
  months: string[];
  // The months with books in the genre picked
  shown: string[];
  active: string | null;
  currentMonth: string;
  hrefFor: (month: string) => string;
  onJump: (month: string) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);

  // Keep the marked month in sight in the bar itself, scrolling just the bar
  useEffect(() => {
    const bar = barRef.current;
    const item = bar?.querySelector<HTMLElement>(`[data-target="${active}"]`);
    if (!bar || !item) return;
    const left = item.offsetLeft;
    const right = left + item.offsetWidth;
    if (left < bar.scrollLeft || right > bar.scrollLeft + bar.clientWidth) {
      bar.scrollLeft = left - (bar.clientWidth - item.offsetWidth) / 2;
    }
  }, [active]);

  const dot = (
    <span className="px-0.5 text-ink-faint" aria-hidden="true">
      ·
    </span>
  );

  return (
    <nav
      aria-label="Genre and month"
      className="sticky top-14 z-10 -mx-4 mb-8 flex items-stretch border-y border-rule bg-paper/90 font-mono text-xs backdrop-blur"
    >
      {genreMenu}
      <div ref={barRef} className="relative min-w-0 flex-1 overflow-x-auto">
        <ol className="flex h-full w-max items-center gap-x-1 px-3 py-1.5">
          {months.map((month, i) => {
            const label = monthShort(month, months[i - 1] ?? currentMonth);
            // Months gone by and this one in full ink, the ones to come grey
            const tone =
              month > currentMonth
                ? "text-ink-faint hover:text-ink"
                : "text-ink";
            // Part of this month's item, not one of its own
            const now = month === currentMonth && (
              <span className="ml-1.5 text-accent group-aria-[current=true]:text-paper">
                TODAY
              </span>
            );
            return (
              <li key={month} className="flex items-center gap-x-1">
                {i > 0 && dot}
                {shown.includes(month) ? (
                  <a
                    href={hrefFor(month)}
                    data-target={month}
                    aria-current={active === month ? "true" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      onJump(month);
                    }}
                    className={`group whitespace-nowrap px-2 py-1 hover:bg-panel-2 aria-[current=true]:bg-ink aria-[current=true]:text-paper ${tone}`}
                  >
                    {label}
                    {now}
                  </a>
                ) : (
                  // Nothing in the genre picked this month
                  <span
                    className={`whitespace-nowrap px-2 py-1 opacity-35 ${tone}`}
                  >
                    {label}
                    {now}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
        className="shrink-0 cursor-pointer border-l border-rule px-4 text-ink-soft hover:text-ink"
      >
        ↑ Top
      </button>
    </nav>
  );
}

// Oldest month first, each month's books by release day, the current month's
// out and coming together. The genre and month live in the address, so a view
// can be shared and Back goes back through them
export function UpcomingList({ books, upNext, read, today }: Props) {
  const searchParams = useSearchParams();
  const genres = genresOf(books);
  const genreParam = searchParams.get("genre");
  const genre = genreParam && genres.includes(genreParam) ? genreParam : null;
  const monthParam = searchParams.get("month");
  const currentMonth = today.slice(0, 7);

  const onUpNext = new Set(upNext);
  const inLog = new Set(read);
  const statusOf = (book: UpcomingBook): Status => {
    const key = titleKey(book.title);
    return onUpNext.has(key) ? "up-next" : inLog.has(key) ? "read" : null;
  };
  const inGenre = (picked: string | null) =>
    books.filter((book) =>
      matchesGenres(book, new Set(picked ? [picked] : [])),
    );
  const sections = byMonth(inGenre(genre));
  // Every month, whatever the genre, so the timeline holds still
  const months = byMonth(books).map(({ month }) => month);
  const shownKey = sections.map(({ month }) => month).join(" ");

  const [active, setActive] = useState<string | null>(null);
  // The month marked, read where state would be a render behind
  const activeRef = useRef<string | null>(null);
  const placedGenre = useRef<string | null | undefined>(undefined);

  const mark = (month: string) => {
    activeRef.current = month;
    setActive(month);
  };

  // The first month of the list goes to the very top, with the page's header
  const place = (month: string, first: string | undefined) => {
    if (month === first) window.scrollTo({ top: 0, behavior: "instant" });
    else
      document
        .getElementById(anchor(month))
        ?.scrollIntoView({ behavior: "instant", block: "start" });
  };

  // Follow the scroll: the month in view is the first one in the band under
  // the bar, or the one above while a gap between months passes, or the first
  // at the top of the page. The address
  // follows along without adding to history
  useEffect(() => {
    const sections = [
      ...document.querySelectorAll<HTMLElement>("[data-month]"),
    ];
    const inBand = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const month = (entry.target as HTMLElement).dataset.month ?? "";
          if (entry.isIntersecting) inBand.add(month);
          else inBand.delete(month);
        }
        const month =
          sections
            .map((section) => section.dataset.month ?? "")
            .find((month) => inBand.has(month)) ??
          sections.findLast(
            (section) => section.getBoundingClientRect().top <= BAND_TOP,
          )?.dataset.month ??
          sections[0]?.dataset.month;
        if (!month || month === activeRef.current) return;
        mark(month);
        history.replaceState(
          null,
          "",
          withParams((params) => params.set("month", month)),
        );
      },
      { rootMargin: `-${BAND_TOP}px 0px -60% 0px` },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [shownKey]);

  // Go to the month in the address when it's opened, when the genre changes,
  // and when Back or Forward lands on another month. Without one the page
  // opens at the top, and goes back there for a genre without the month
  useEffect(() => {
    const opening = placedGenre.current === undefined;
    const genreChanged = placedGenre.current !== genre;
    placedGenre.current = genre;
    // The address following the scroll needs no jump
    if (!genreChanged && monthParam === activeRef.current) return;
    const shown = shownKey.split(" ");
    if (monthParam && shown.includes(monthParam)) place(monthParam, shown[0]);
    else if (!opening) window.scrollTo({ top: 0, behavior: "instant" });
  }, [genre, monthParam, shownKey]);

  if (books.length === 0) {
    return <p className="text-ink-soft">Nothing new right now.</p>;
  }

  // Into history before scrolling, so the entry left behind keeps its place
  const jump = (month: string) => {
    mark(month);
    history.pushState(
      null,
      "",
      withParams((params) => params.set("month", month)),
    );
    place(month, sections[0]?.month);
  };

  // A genre keeps the month in view when it has books then, and starts
  // afresh when it doesn't
  const pickGenre = (picked: string | null) => {
    const kept = byMonth(inGenre(picked)).some(
      ({ month }) => month === activeRef.current,
    );
    history.pushState(
      null,
      "",
      withParams((params) => {
        if (picked) params.set("genre", picked);
        else params.delete("genre");
        if (kept && activeRef.current) params.set("month", activeRef.current);
        else params.delete("month");
      }),
    );
  };

  const hrefFor = (month: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", month);
    return `?${params}`;
  };

  return (
    <div>
      <FilterBar
        genreMenu={
          <GenreMenu
            genres={genres.map((genre) => ({
              genre,
              count: inGenre(genre).length,
            }))}
            total={books.length}
            current={genre}
            onPick={pickGenre}
          />
        }
        months={months}
        shown={sections.map(({ month }) => month)}
        active={active}
        currentMonth={currentMonth}
        hrefFor={hrefFor}
        onJump={jump}
      />
      <div className="space-y-14">
        {sections.map(({ month, books }) => (
          <MonthSection
            key={month}
            month={month}
            books={books}
            statusOf={statusOf}
            today={today}
          />
        ))}
      </div>
    </div>
  );
}
