import { cacheLife } from "next/cache";
import { localDate } from "@/utils/formatters/date";

export async function renderTime() {
  "use cache";
  cacheLife("hours");
  return Date.now();
}

export async function thisYear() {
  return localDate(new Date(await renderTime())).year;
}
