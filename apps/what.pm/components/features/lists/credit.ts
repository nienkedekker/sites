import type { ValidItemType } from "@/types/shared";

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
