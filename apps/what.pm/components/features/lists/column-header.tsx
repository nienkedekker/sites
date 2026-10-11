import type { ReactNode } from "react";
import { SWATCH, type ItemType } from "@nienke/ui/series";
import SwellText from "@nienke/ui/swell-text";
import { cn } from "@/utils/ui";

export function ColumnHeader({
  id,
  type,
  title,
  count,
}: {
  id: string;
  type: ItemType;
  title: string;
  count: ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-4 border-b border-rule pb-3">
      <h2
        id={id}
        className="display flex items-center gap-3 text-ink text-[1.875rem] sm:text-[2.5rem]"
      >
        <span
          className={cn("size-3 shrink-0", SWATCH[type])}
          aria-hidden="true"
        />
        <SwellText>{title}</SwellText>
      </h2>
      <p className="pb-1 font-mono text-xs text-ink-soft tabular-nums">
        {count}
      </p>
    </header>
  );
}
