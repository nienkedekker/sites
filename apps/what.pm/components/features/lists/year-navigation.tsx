import { getDistinctYears } from "@/utils/data/items";
import { getCurrentYear } from "@/utils/formatters/date";
import { YearLinks } from "./year-links";

export default async function YearNavigation() {
  // No fallback: a failed regeneration keeps the last good page in ISR
  const years = await getDistinctYears();

  if (years.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Browse by year" className="border-b border-rule">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <YearLinks years={years} currentYear={getCurrentYear()} />
      </div>
    </nav>
  );
}
