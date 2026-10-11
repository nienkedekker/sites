"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface YearLinksProps {
  years: number[];
  currentYear: number;
}

export function YearLinks(props: YearLinksProps) {
  return <YearLinksFor {...props} pathname={usePathname()} />;
}

export function YearLinksFor({
  years,
  currentYear,
  pathname,
}: YearLinksProps & { pathname: string | null }) {
  const getActiveYear = (): number | null => {
    if (pathname === "/") return currentYear;
    const match = pathname?.match(/^\/year\/(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  };

  const activeYear = getActiveYear();
  const barRef = useRef<HTMLDivElement>(null);

  // Keep the year shown in sight on a phone, scrolling just the bar; again
  // once the fonts are in, as they change how wide the years are
  useEffect(() => {
    const keepInSight = () => {
      const bar = barRef.current;
      const item = bar?.querySelector<HTMLElement>('[aria-current="page"]');
      if (!bar || !item) return;
      const left = item.offsetLeft;
      const right = left + item.offsetWidth;
      if (left < bar.scrollLeft || right > bar.scrollLeft + bar.clientWidth) {
        bar.scrollLeft = left - (bar.clientWidth - item.offsetWidth) / 2;
      }
    };
    keepInSight();
    document.fonts.ready.then(keepInSight);
  }, [activeYear]);

  // Only on the log's own pages, one year each, where the others are a click
  // away; elsewhere, and while the path is unknown, there's no strip
  if (activeYear === null) return null;

  // Drawn like the filter bar on Discover: a label, then one row of years to
  // pick, sideways on a phone
  return (
    <nav aria-label="Browse by year" className="border-b border-rule">
      <div className="mx-auto flex max-w-6xl items-stretch font-mono text-xs">
        <span className="flex shrink-0 items-center border-r border-rule px-4 py-2.5 uppercase tracking-[0.06em] text-ink-faint">
          Year
        </span>
        <div ref={barRef} className="relative min-w-0 flex-1 overflow-x-auto">
          <ol className="flex w-max items-center gap-x-1 px-3 py-1.5 tabular-nums">
            {years.map((y, i) => (
              <li key={y} className="flex items-center gap-x-1">
                {i > 0 && (
                  <span className="px-0.5 text-ink-faint" aria-hidden="true">
                    ·
                  </span>
                )}
                <Link
                  href={y === currentYear ? "/" : `/year/${y}`}
                  aria-current={y === activeYear ? "page" : undefined}
                  className="block whitespace-nowrap px-1.5 py-1 text-ink hover:bg-panel-2 aria-[current=page]:bg-ink aria-[current=page]:text-paper"
                >
                  {y}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </nav>
  );
}
