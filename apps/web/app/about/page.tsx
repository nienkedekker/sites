import Image from "next/image";
import tumblr from "./tumblr.png";
import Link from "next/link";
import type { CSSProperties } from "react";
import PageHeader from "@nienke/ui/page-header";
import { getLogFacts, type LogFacts } from "@/utils/data/about";
import { formatCount } from "@nienke/ui/format";

const TYPE_ROWS = [
  { key: "books", label: "Books", swatch: "bg-books" },
  { key: "movies", label: "Movies", swatch: "bg-movies" },
  { key: "shows", label: "TV seasons", swatch: "bg-shows" },
] as const;

function LogNumbers({ facts }: { facts: LogFacts }) {
  return (
    <section aria-labelledby="log-numbers-heading">
      <h2 id="log-numbers-heading" className="sr-only">
        The log in numbers
      </h2>
      <p className="stat-figure text-7xl">
        {formatCount(facts.total)}
      </p>
      <p className="mt-3 text-ink-soft">
        things logged across {facts.yearCount} years.
      </p>

      <dl className="mt-8 border-t border-rule">
        {TYPE_ROWS.map(({ key, label, swatch }) => (
          <div
            key={key}
            className="flex items-center gap-3 border-b border-line py-3"
          >
            <span
              className={`size-2.5 shrink-0 ${swatch}`}
              aria-hidden="true"
            />
            <dt className="flex-1 text-ink-soft">{label}</dt>
            <dd className="font-mono text-sm text-ink tabular-nums">
              {formatCount(facts[key])}
            </dd>
          </div>
        ))}
        <div className="flex items-center gap-3 border-b border-line py-3">
          <dt className="flex-1 text-ink-soft">Logging since</dt>
          <dd className="font-mono text-sm tabular-nums">
            <Link
              href={`/year/${facts.firstYear}`}
              className="link text-ink"
            >
              {facts.firstYear}
            </Link>
          </dd>
        </div>
        {facts.firstEntry && (
          <div className="flex items-baseline gap-3 border-b border-line py-3">
            <dt className="shrink-0 text-ink-soft">First entry</dt>
            <dd className="min-w-0 flex-1 truncate text-right">
              <span className="font-medium tracking-[-0.01em] text-ink">
                {facts.firstEntry.title}
              </span>
              {facts.firstEntry.by && (
                <span className="text-ink-soft"> · {facts.firstEntry.by}</span>
              )}
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}

export default async function AboutPage() {
  let facts: LogFacts | null = null;
  try {
    facts = await getLogFacts();
  } catch (error) {
    console.error("Error loading log facts:", error);
  }

  return (
    <div className="grid items-start gap-y-14 lg:grid-cols-[1fr_2fr] lg:gap-x-14">
      <div>
        <PageHeader className="mb-0">About</PageHeader>
        <div
          className="rise prose mt-8"
          style={{ "--delay": "160ms" } as CSSProperties}
        >
          <p>
            I (<Link href="https://nienke.dev">Nienke</Link>) like to log what I
            read and watch in a year :) find the source code for this site{" "}
            <Link href="https://github.com/nienkedekker/sites">here</Link>.
          </p>
        </div>
        {facts && (
          <div
            className="rise mt-12"
            style={{ "--delay": "240ms" } as CSSProperties}
          >
            <LogNumbers facts={facts} />
          </div>
        )}
      </div>

      <figure
        className="rise above-grain w-full border border-rule shadow-[6px_6px_0_var(--rule)] lg:mt-24"
        style={{ "--delay": "200ms" } as CSSProperties}
      >
        <Image
          className="block h-auto w-full"
          src={tumblr}
          sizes="(min-width: 1024px) 680px, 100vw"
          alt="A screenshot of a Tumblr post by user so-many-ocs, with the text '[on the verge of having a complete breakdown] i need to make some kind of list or perhaps sort things into categories'"
        />
      </figure>
    </div>
  );
}
