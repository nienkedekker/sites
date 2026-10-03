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
  return (
    <section className="panel h-full">
      <UiStatTile
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
