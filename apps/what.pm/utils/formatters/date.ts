export const TIME_ZONE = "Europe/Amsterdam";

const calendar = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

export function localDate(date: Date) {
  const parts = Object.fromEntries(
    calendar
      .formatToParts(date)
      .map(({ type, value }) => [type, Number(value)]),
  );
  return { year: parts.year, month: parts.month, day: parts.day };
}

export function getCurrentYear(): number {
  return localDate(new Date()).year;
}
