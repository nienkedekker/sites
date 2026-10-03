import Link from "next/link";
import UiStatTile from "@nienke/ui/stat-tile";
import Tag from "@nienke/ui/tag";
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
  const id = `${title.toLowerCase().replace(/\W+/g, "-")}-heading`;

  return (
    <section aria-labelledby={id} className="panel h-full">
      <UiStatTile
        id={id}
        title={title}
        value={value}
        tag={
          tag &&
          (href ? (
            <TagLink as={Link} href={href}>
              {tag}
            </TagLink>
          ) : (
            <Tag>{tag}</Tag>
          ))
        }
      >
        {children}
      </UiStatTile>
    </section>
  );
}
