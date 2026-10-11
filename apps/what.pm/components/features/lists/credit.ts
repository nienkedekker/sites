import type { ValidItemType } from "@/types/shared";

export const MADE_BY: Record<ValidItemType, string> = {
  Book: "by",
  Movie: "dir.",
  Show: "created by",
};

export function credit({
  itemtype,
  creator,
  year,
}: {
  itemtype: ValidItemType;
  creator: string | null | undefined;
  year: number | null | undefined;
}) {
  const made = creator && `${MADE_BY[itemtype]} ${creator}`;
  return [made, year && `(${year})`].filter(Boolean).join(" ");
}
