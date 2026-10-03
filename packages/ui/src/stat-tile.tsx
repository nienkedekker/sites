import type { ReactNode } from "react";
import CardHead from "./card-head";
import { formatCount } from "./format";

interface StatTileProps {
  title: ReactNode;
  value: number | string | null;
  children: ReactNode;
  as?: "h2" | "h3";
  id?: string;
  tag?: ReactNode;
  size?: "6xl" | "7xl";
}

export default function StatTile({
  title,
  value,
  children,
  as,
  id,
  tag,
  size = "6xl",
}: StatTileProps) {
  return (
    <div className="flex h-full flex-col">
      <CardHead as={as} id={id} tag={tag}>
        {title}
      </CardHead>
      <div className="mt-auto pt-8">
        {value === null ? (
          <div className={`skeleton w-28 ${size === "7xl" ? "h-[4.5rem]" : "h-15"}`} />
        ) : (
          <p className={`stat-figure ${size === "7xl" ? "text-7xl" : "text-6xl"}`}>
            {typeof value === "number" ? formatCount(value) : value}
          </p>
        )}
        <p className="mt-3 text-sm text-ink-soft">{children}</p>
      </div>
    </div>
  );
}
