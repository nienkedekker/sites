import { cacheLife } from "next/cache";
import { localDate } from "@/utils/formatters/date";

// Prerendered pages can't read the clock directly, so they share one that
// refreshes with them every hour
export async function renderTime() {
  "use cache";
  cacheLife("hours");
  return Date.now();
}

export async function thisYear() {
  return localDate(new Date(await renderTime())).year;
}
