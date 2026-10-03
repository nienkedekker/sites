import Link from "next/link";
import CardHead from "@nienke/ui/card-head";
import { formatCount } from "@nienke/ui/format";
import TagLink from "@nienke/ui/tag-link";
import type { ReactNode } from "react";

interface StatTileProps {
  title: string;
  value: number;
  children: ReactNode;
  href?: string;
  tag?: string;
}

export function StatTile({ title, value, children, href, tag }: StatTileProps) {
  return (
    <section className="above-grain card flex h-full flex-col p-6 sm:p-7">
      <CardHead
        tag={
          tag &&
          (href ? (
            <TagLink as={Link} href={href}>
              {tag}
            </TagLink>
          ) : (
            <span className="tag">{tag}</span>
          ))
        }
      >
        {title}
      </CardHead>
      <p className="stat-figure mt-auto pt-8 text-6xl">
        {formatCount(value)}
      </p>
      <p className="mt-3 text-sm text-ink-soft">{children}</p>
    </section>
  );
}
