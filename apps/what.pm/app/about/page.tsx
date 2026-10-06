import Image from "next/image";
import tumblr from "./tumblr.png";
import Link from "next/link";
import type { CSSProperties } from "react";
import PageHeader from "@nienke/ui/page-header";
import { getLogFacts, type LogFacts } from "@/utils/data/about";
import { formatCount } from "@nienke/ui/format";
import { SERIES } from "@nienke/ui/series";
import { StatList, StatRow } from "@nienke/ui/stat-list";
import {
  IS_MINE,
  OWNER_FIRST_NAME,
  OWNER_URL,
  SOURCE_URL,
} from "@/utils/constants/site";

function LogNumbers({ facts }: { facts: LogFacts }) {
  return (
    <section aria-labelledby="log-numbers-heading">
      <h2 id="log-numbers-heading" className="sr-only">
        The log in numbers
      </h2>
      <p className="stat-figure text-7xl">{formatCount(facts.total)}</p>
      <p className="mt-3 text-ink-soft">
        things logged across {facts.yearCount} years.
      </p>

      <StatList rule="bottom" className="mt-8 border-t border-rule">
        {SERIES.map(({ key, label, swatch }) => (
          <StatRow key={key} label={label} swatch={swatch} className="py-3">
            <span className="font-mono text-sm text-ink">
              {formatCount(facts[key])}
            </span>
          </StatRow>
        ))}
        {facts.firstYear !== null && (
          <StatRow label="Logging since" className="py-3">
            <Link
              href={`/year/${facts.firstYear}`}
              className="link font-mono text-sm text-ink"
            >
              {facts.firstYear}
            </Link>
          </StatRow>
        )}
        {facts.firstEntry && (
          <StatRow label="First entry" className="py-3">
            <span className="wrap-break-word font-medium tracking-[-0.01em] text-ink">
              {facts.firstEntry.title}
            </span>
            {facts.firstEntry.by && (
              <span className="text-ink-soft"> · {facts.firstEntry.by}</span>
            )}
          </StatRow>
        )}
      </StatList>
    </section>
  );
}

export default async function AboutPage() {
  // Thrown, not hidden, so ISR keeps the last good page instead of the gap
  const facts = await getLogFacts();

  return (
    <div className="grid items-start gap-y-14 lg:grid-cols-[1fr_2fr] lg:gap-x-14">
      <div>
        <PageHeader className="mb-0">About</PageHeader>
        <div
          className="rise prose mt-8"
          style={{ "--delay": "160ms" } as CSSProperties}
        >
          <p>
            I (<Link href={OWNER_URL}>{OWNER_FIRST_NAME}</Link>) like to log
            what I read and watch in a year :) find the source code for this
            site <Link href={SOURCE_URL}>here</Link>.
          </p>
        </div>
        <div
          className="rise mt-12"
          style={{ "--delay": "240ms" } as CSSProperties}
        >
          <LogNumbers facts={facts} />
        </div>
      </div>

      {IS_MINE && (
        <figure
          className="rise above-grain framed w-full lg:mt-24"
          style={{ "--delay": "200ms" } as CSSProperties}
        >
          <Image
            className="block h-auto w-full"
            src={tumblr}
            sizes="(min-width: 1024px) 680px, 100vw"
            alt="A screenshot of a Tumblr post by user so-many-ocs, with the text '[on the verge of having a complete breakdown] i need to make some kind of list or perhaps sort things into categories'"
          />
        </figure>
      )}
    </div>
  );
}
