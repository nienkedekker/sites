const LOCALE = "en-US";

export function formatCount(n: number) {
  return n.toLocaleString(LOCALE);
}

export function formatDate(date: Date, options: Intl.DateTimeFormatOptions) {
  return date.toLocaleDateString(LOCALE, { timeZone: "UTC", ...options });
}

export function formatPlural(n: number, singular: string, plural = `${singular}s`) {
  return `${formatCount(n)} ${n === 1 ? singular : plural}`;
}
