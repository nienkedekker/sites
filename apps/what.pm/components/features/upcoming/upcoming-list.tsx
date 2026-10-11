"use client";

import { useState } from "react";
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
  type UpcomingBook,
} from "@/utils/data/upcoming";
import { normalizeTitle } from "@/utils/data/patterns";

// Release dates are calendar days, so read them in UTC to keep the day
const day = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
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

function BookRow({
  book,
  known,
  out,
}: {
  book: UpcomingBook;
  known: boolean;
  out: boolean;
}) {
  const href = book.slug ? `https://hardcover.app/books/${book.slug}` : null;
  const author = book.authors.join(", ");
  return (
    <article className="flex gap-4 border-t border-line py-5 first:border-t-0 sm:gap-5">
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
          {known ? (
            <span>On your list</span>
          ) : (
            <QuietActions
              subject={book.title}
              fields={{
                title: book.title,
                author: book.authors[0] ?? "",
                year: book.releaseDate.slice(0, 4),
              }}
              actions={[
                { label: "Put on up next", action: addUpcomingToUpNext },
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
  // The genres I read most, picked to start with
  favourites: string[];
  // Normalised titles already logged or on up next
  known: string[];
  // YYYY-MM-DD in Amsterdam: books released by then are out
  today: string;
}

function Months({
  books,
  newestFirst,
  known,
  today,
}: {
  books: UpcomingBook[];
  newestFirst: boolean;
  known: Set<string>;
  today: string;
}) {
  return (
    <div className="space-y-14">
      {byMonth(books, newestFirst).map(({ month, books }) => (
        <section key={month} aria-labelledby={`month-${month}`}>
          <header className="flex items-end justify-between gap-4 border-b border-rule pb-3">
            <h3
              id={`month-${month}`}
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
                known={known.has(normalizeTitle(book.title))}
                out={isOut(book, today)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function UpcomingList({ books, favourites, known, today }: Props) {
  const genres = genresOf(books);
  const [picked, setPicked] = useState(
    () => new Set(favourites.filter((genre) => genres.includes(genre))),
  );
  const knownTitles = new Set(known);
  const shown = books.filter((book) => matchesGenres(book, picked));
  const out = shown.filter((book) => isOut(book, today));
  const coming = shown.filter((book) => !isOut(book, today));

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
          {[
            {
              title: "Out now",
              note: "the last two months, newest first",
              books: out,
              newestFirst: true,
            },
            {
              title: "Coming soon",
              note: "the next six months",
              books: coming,
              newestFirst: false,
            },
          ]
            .filter((part) => part.books.length > 0)
            .map((part) => (
              <section key={part.title} aria-label={part.title}>
                <h2 className="mb-8 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="tag">{part.title}</span>
                  <span className="font-mono text-xs text-ink-faint">
                    {part.note}
                  </span>
                </h2>
                <Months
                  books={part.books}
                  newestFirst={part.newestFirst}
                  known={knownTitles}
                  today={today}
                />
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
