import type { ValidItemType } from "@/types/shared";

// Who made it and when, as the log shows it: "by John Langan (2016)",
// "dir. Kiyoshi Kurosawa (1997)", "created by Mike Flanagan (2021)"
export function credit({
  itemtype,
  creator,
  year,
}: {
  itemtype: ValidItemType;
  creator: string | null | undefined;
  year: number | null | undefined;
}) {
  const made =
    creator &&
    (itemtype === "Book"
      ? `by ${creator}`
      : itemtype === "Movie"
        ? `dir. ${creator}`
        : `created by ${creator}`);
  return [made, year && `(${year})`].filter(Boolean).join(" ");
}
