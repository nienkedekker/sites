"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface YearLinksProps {
  years: number[];
  currentYear: number;
}

export function YearLinks({ years, currentYear }: YearLinksProps) {
  const pathname = usePathname();

  const getActiveYear = (): number | null => {
    if (pathname === "/") return currentYear;
    const match = pathname.match(/^\/year\/(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  };

  const activeYear = getActiveYear();

  return (
    <ul className="flex flex-wrap gap-x-1 gap-y-1.5 font-mono text-sm tabular-nums">
      {years.map((y) => {
        const isActive = y === activeYear;
        return (
          <li key={y}>
            <Link
              href={y === currentYear ? "/" : `/year/${y}`}
              aria-current={isActive ? "page" : undefined}
              className="block border border-transparent px-1.5 py-0.5 text-ink-soft transition-colors hover:border-rule hover:text-ink aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-paper"
            >
              {y}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
