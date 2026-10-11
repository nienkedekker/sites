"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatPlural } from "@nienke/ui/format";
import { sourceOf } from "@/components/features/lists/item-source";
import { Cover } from "@/components/ui/cover";
import { ItemRow } from "@/components/ui/item-row";
import { ReadMore } from "@/components/ui/read-more";
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

type Status = "up-next" | "read" | null;

function Description({ runs }: { runs: Run[] }) {
  return (
    <div className="mt-3">
      <ReadMore
        clamp="line-clamp-3"
        className="text-sm whitespace-pre-line text-ink"
        toggle="text"
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
      </ReadMore>
    </div>
  );
}

interface GenreFilter {
  genre: string | null;
  onGenre: (genre: string | null) => void;
}

function BookRow({
  book,
  status,
  out,
  genre: current,
  onGenre,
}: {
  book: UpcomingBook;
  status: Status;
  out: boolean;
} & GenreFilter) {
  const [added, setAdded] = useState(false);
  const shown = added ? "up-next" : status;
  const goodreads = sourceOf({
    itemtype: "Book",
    external_id: null,
    title: book.title,
    author: book.authors[0] ?? null,
  });
  const author = book.authors.join(", ");
  return (
    <ItemRow
      as="article"
      className={`border-t border-line py-5 transition-opacity first:border-t-0 ${shown ? "opacity-45 hover:opacity-100 focus-within:opacity-100" : ""}`}
      cover={
        <Cover
          src={book.cover?.url}
          title={book.title}
          type="Book"
          sizes="96px"
          className="aspect-2/3 w-20 self-start sm:w-24"
        />
      }
      title={book.title}
      href={goodreads?.href}
      meta={
        <>
          {author && `by ${author} · `}
          {out ? (
            `out ${day(book.releaseDate)}`
          ) : (
            <span className="font-medium text-ink">
              Not out yet: {day(book.releaseDate)}
            </span>
          )}
          {book.genres.length > 0 && (
            <span className="ml-2 inline-flex flex-wrap gap-1.5 align-middle">
              {book.genres.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  aria-pressed={genre === current}
                  onClick={() => onGenre(genre === current ? null : genre)}
                  className="tag whitespace-nowrap"
                >
                  {genre}
                </button>
              ))}
            </span>
          )}
        </>
      }
      actions={
        shown === "up-next" ? (
          <Link
            href="/discover/for-you#up-next"
            className="inline-block bg-ink px-1.5 py-0.5 text-paper"
          >
            ✓ On Up next
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
                label: "+ Up next",
                ariaLabel: `Put ${book.title} on Up next`,
                action: async (formData) => {
                  const result = await addUpcomingToUpNext(formData);
                  if (!result.error) setAdded(true);
                  return result;
                },
              },
            ]}
          />
        )
      }
    >
      {book.description && <Description runs={book.description} />}
    </ItemRow>
  );
}

interface Props {
  books: UpcomingBook[];
  upNext: string[];
  read: string[];
  today: string;
}

const BAND_TOP = 100;

const anchor = (month: string) => `month-${month}`;

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
  ...filter
}: {
  month: string;
  books: UpcomingBook[];
  statusOf: (book: UpcomingBook) => Status;
  today: string;
} & GenreFilter) {
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
      className="scroll-mt-28"
    >
      <header className="flex items-end justify-between gap-4 border-b border-rule pb-3">
        <h2
          id={`${anchor(month)}-heading`}
          className="display display-section text-ink"
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
            {...filter}
          />
        ))}
      </div>
    </section>
  );
}

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
  shown: string[];
  active: string | null;
  currentMonth: string;
  hrefFor: (month: string) => string;
  onJump: (month: string) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);

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
      className="sticky top-14 z-10 mb-8 flex items-stretch border-y border-rule bg-paper/90 font-mono text-xs backdrop-blur"
    >
      {genreMenu}
      <div ref={barRef} className="relative min-w-0 flex-1 overflow-x-auto">
        <ol className="flex h-full w-max items-center gap-x-1 px-3 py-1.5">
          {months.map((month, i) => {
            const label = monthShort(month, months[i - 1] ?? currentMonth);
            const tone =
              month > currentMonth
                ? "text-ink-faint hover:text-ink"
                : "text-ink";
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
                    className={`nav-link whitespace-nowrap ${tone}`}
                  >
                    {label}
                  </a>
                ) : (
                  <span
                    className={`block whitespace-nowrap px-2 py-1.5 opacity-35 sm:px-3 ${tone}`}
                  >
                    {label}
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
        className="shrink-0 cursor-pointer border-l border-rule pl-4 text-ink-soft hover:text-ink"
      >
        ↑ Top
      </button>
    </nav>
  );
}

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
  const months = byMonth(books).map(({ month }) => month);
  const shownKey = sections.map(({ month }) => month).join(" ");

  const [active, setActive] = useState<string | null>(null);
  // The month marked, read where state would be a render behind
  const activeRef = useRef<string | null>(null);
  const placed = useRef<{ genre: string | null; month: string | null }>(null);

  const mark = (month: string) => {
    activeRef.current = month;
    setActive(month);
  };

  const place = (month: string, first: string | undefined) => {
    if (month === first) window.scrollTo({ top: 0, behavior: "instant" });
    else
      document
        .getElementById(anchor(month))
        ?.scrollIntoView({ behavior: "instant", block: "start" });
  };

  // Follow the scroll: the month in view is the first one in the band under
  // the bar, or the one above while a gap between months passes, or the first
  // at the top of the page. The address is left alone, so opening the page
  // again never lands halfway down
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
        if (month && month !== activeRef.current) mark(month);
      },
      { rootMargin: `-${BAND_TOP}px 0px -60% 0px` },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [shownKey]);

  // The page opens at the top, whatever the address says. A genre keeps the
  // month in view when it has books then, and starts from the top when it
  // doesn't; Back and Forward go to the month clicked then
  useEffect(() => {
    const last = placed.current;
    placed.current = { genre, month: monthParam };
    if (!last || (last.genre === genre && last.month === monthParam)) return;
    const genreChanged = last.genre !== genre;
    const shown = shownKey.split(" ");
    const target = genreChanged ? activeRef.current : monthParam;
    if (!genreChanged && monthParam === activeRef.current) return;
    if (target && shown.includes(target)) place(target, shown[0]);
    else window.scrollTo({ top: 0, behavior: "instant" });
  }, [genre, monthParam, shownKey]);

  if (books.length === 0) {
    return <p className="text-ink-soft">Nothing new right now.</p>;
  }

  const jump = (month: string) => {
    mark(month);
    history.pushState(
      null,
      "",
      withParams((params) => params.set("month", month)),
    );
    place(month, sections[0]?.month);
  };

  const pickGenre = (picked: string | null) =>
    history.pushState(
      null,
      "",
      withParams((params) => {
        if (picked) params.set("genre", picked);
        else params.delete("genre");
        params.delete("month");
      }),
    );

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
            genre={genre}
            onGenre={pickGenre}
          />
        ))}
      </div>
    </div>
  );
}
