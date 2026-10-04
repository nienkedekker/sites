import type { CSSProperties, ReactNode } from "react";
import SwellText from "./swell-text";

interface PageHeaderProps {
  children: ReactNode;
  intro?: ReactNode;
  eyebrow?: ReactNode;
  className?: string;
}

export default function PageHeader({
  children,
  intro,
  eyebrow,
  className = "mb-12 sm:mb-16",
}: PageHeaderProps) {
  return (
    <header className={`max-w-2xl ${className}`}>
      {eyebrow && <p className="rise tag mb-6">{eyebrow}</p>}
      <h1
        className="rise display text-ink text-[clamp(2.75rem,7vw,4.5rem)]"
        style={{ "--delay": "80ms" } as CSSProperties}
      >
        {typeof children === "string" || typeof children === "number" ? (
          <SwellText key={String(children)}>{String(children)}</SwellText>
        ) : (
          children
        )}
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
