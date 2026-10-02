import Link from "next/link";
import type { ReactNode } from "react";

interface StatTileProps {
  title: string;
  value: number;
  children: ReactNode;
  /** Makes the tag under the title a link, e.g. to a year */
  href?: string;
  tag?: string;
}

/** A small bento card: title and tag on top, one big number at the bottom */
export function StatTile({ title, value, children, href, tag }: StatTileProps) {
  return (
    <section className="card flex h-full flex-col p-6 sm:p-7">
      <div className="flex flex-col items-start gap-2">
        <h2 className="font-medium tracking-[-0.01em]">{title}</h2>
        {tag &&
          (href ? (
            <Link href={href} className="tag">
              {tag} <span aria-hidden="true">↗</span>
            </Link>
          ) : (
            <span className="tag">{tag}</span>
          ))}
      </div>
      <p className="mt-auto pt-8 text-6xl leading-none font-semibold tracking-[-0.05em] text-ink tabular-nums">
        {value.toLocaleString("en-GB")}
      </p>
      <p className="mt-3 text-sm text-ink-soft">{children}</p>
    </section>
  );
}
