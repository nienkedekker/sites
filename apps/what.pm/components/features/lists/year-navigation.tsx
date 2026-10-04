import { getDistinctYears } from "@/utils/data/items";
import { thisYear } from "@/utils/server/clock";
import { Suspense } from "react";
import { YearLinks, YearLinksFor } from "./year-links";

export default async function YearNavigation() {
  // No fallback: a failed regeneration keeps the last good page in ISR
  const [years, year] = await Promise.all([getDistinctYears(), thisYear()]);

  if (years.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Browse by year" className="border-b border-rule">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <Suspense
          fallback={
            <YearLinksFor years={years} currentYear={year} pathname={null} />
          }
        >
          <YearLinks years={years} currentYear={year} />
        </Suspense>
      </div>
    </nav>
  );
}
