const LOCALE = "en-US";

export function formatCount(n: number) {
  return n.toLocaleString(LOCALE);
}

export function formatDate(date: Date, options: Intl.DateTimeFormatOptions) {
  return date.toLocaleDateString(LOCALE, { timeZone: "UTC", ...options });
}
