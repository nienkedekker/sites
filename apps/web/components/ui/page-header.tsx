import { CSSProperties, ReactNode } from "react";
import { cn } from "@/utils/ui";

interface PageHeaderProps {
  children: ReactNode;
  /** A line of larger, softer text under the title */
  intro?: ReactNode;
  /** A small tag above the title, e.g. a count or a date */
  eyebrow?: ReactNode;
  className?: string;
}

/** Page title in the serif display face, like nienke.dev's pages */
export function PageHeader({
  children,
  intro,
  eyebrow,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("mb-12 max-w-2xl sm:mb-16", className)}>
      {eyebrow && <p className="rise tag mb-6">{eyebrow}</p>}
      <h1
        className="rise display text-ink text-[clamp(2.75rem,7vw,4.5rem)]"
        style={{ "--delay": "80ms" } as CSSProperties}
      >
        {children}
      </h1>
      {intro && (
        <p
          className="rise mt-5 text-lg text-ink-soft sm:text-xl"
          style={{ "--delay": "160ms" } as CSSProperties}
        >
          {intro}
        </p>
      )}
    </header>
  );
}
