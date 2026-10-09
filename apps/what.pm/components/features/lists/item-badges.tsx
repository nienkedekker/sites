import { RotateCcw, Clock, type LucideIcon } from "lucide-react";
import { Item } from "@/types";
import { cn } from "@/utils/ui";
import { badgeStyles } from "@/utils/styles";

function ItemBadge({
  icon: Icon,
  label,
  variant,
  ariaLabel,
  className,
}: {
  icon: LucideIcon;
  label: string;
  variant: "progress" | "redo";
  ariaLabel: string;
  className?: string;
}) {
  return (
    <span className={cn(badgeStyles.base, badgeStyles[variant], className)}>
      <Icon className="size-3" aria-hidden="true" />
      <span aria-hidden="true">{label}</span>
      <span className="sr-only">{ariaLabel}</span>
    </span>
  );
}

export function ItemBadges({
  item,
  className,
}: {
  item: Item;
  className?: string;
}) {
  if (item.itemtype !== "Movie" && item.in_progress) {
    const isBook = item.itemtype === "Book";
    if (item.redo) {
      return (
        <ItemBadge
          icon={RotateCcw}
          label={isBook ? "Reread in progress" : "Rewatch in progress"}
          variant="progress"
          className={className}
          ariaLabel={
            isBook
              ? "Currently rereading this book"
              : "Currently rewatching this show"
          }
        />
      );
    }
    return (
      <ItemBadge
        icon={Clock}
        label="In progress"
        variant="progress"
        className={className}
        ariaLabel={
          isBook
            ? "Currently reading this book"
            : "Currently watching this show"
        }
      />
    );
  }

  if (item.redo) {
    const isBook = item.itemtype === "Book";
    return (
      <ItemBadge
        icon={RotateCcw}
        label={isBook ? "Reread" : "Rewatch"}
        variant="redo"
        className={className}
        ariaLabel={isBook ? "This was a re-read" : "This was a rewatch"}
      />
    );
  }

  return null;
}
