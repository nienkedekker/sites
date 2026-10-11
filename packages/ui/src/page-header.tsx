import type { CSSProperties, ElementType, ReactNode } from "react";
import NavLinks from "./nav-links";
import SwellText from "./swell-text";

interface PageTabs {
  label: string;
  links: readonly { href: string; label: string }[];
  current: string;
  as?: ElementType;
}

interface PageHeaderProps {
  children: ReactNode;
  intro?: ReactNode;
  eyebrow?: ReactNode;
  tabs?: PageTabs;
  className?: string;
}

export default function PageHeader({
  children,
  intro,
  eyebrow,
  tabs,
  className = tabs ? "mb-8" : "mb-12 sm:mb-16",
}: PageHeaderProps) {
  return (
    <header className={`max-w-2xl ${className}`}>
      {eyebrow && <p className="rise tag mb-6">{eyebrow}</p>}
      <h1
        className="rise display display-page text-ink"
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
      {/* Pulled left by the links' own padding, so their text lines up with
          the heading's */}
      {tabs && (
        <nav
          aria-label={tabs.label}
          className="rise mt-4 -ml-2 sm:-ml-3"
          style={{ "--delay": intro ? "240ms" : "160ms" } as CSSProperties}
        >
          <NavLinks
            links={tabs.links}
            currentPath={tabs.current}
            as={tabs.as}
          />
        </nav>
      )}
    </header>
  );
}
