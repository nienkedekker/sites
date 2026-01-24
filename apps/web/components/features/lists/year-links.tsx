"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface YearLinksProps {
  years: number[];
}

export function YearLinks({ years }: YearLinksProps) {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  const getActiveYear = (): number | null => {
    if (pathname === "/") return currentYear;
    const match = pathname.match(/^\/year\/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  };

  const activeYear = getActiveYear();

  return (
    <ul className="flex gap-4 flex-wrap">
      {years.map((y) => {
        const isActive = y === activeYear;
        return (
          <li key={y}>
            <Link
              href={y === currentYear ? "/" : `/year/${y}`}
              className={
                isActive
                  ? "font-bold text-indigo-800 dark:text-indigo-200"
                  : "text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              }
            >
              {y}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
