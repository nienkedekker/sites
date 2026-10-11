import type { ReactNode } from "react";
import { externalProps } from "@nienke/ui/external";

export function ItemTitle({
  title,
  href,
  className = "",
}: {
  title: string;
  href?: string | null;
  className?: string;
}) {
  return (
    <h3
      className={`wrap-break-word font-medium leading-snug tracking-[-0.01em] text-ink ${className}`}
    >
      {href ? (
        <a
          href={href}
          className="underline decoration-transparent underline-offset-4 transition-colors hover:decoration-ink"
          {...externalProps(href)}
        >
          {title}
        </a>
      ) : (
        title
      )}
    </h3>
  );
}

export function ItemRow({
  as: Tag = "li",
  cover,
  title,
  href,
  meta,
  actions,
  className = "",
  children,
}: {
  as?: "li" | "article";
  cover: ReactNode;
  title: string;
  href?: string | null;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Tag className={`flex gap-4 sm:gap-5 ${className}`}>
      {cover}
      <div className="min-w-0 flex-1">
        <ItemTitle title={title} href={href} />
        {meta && <p className="mt-1 text-sm text-ink-soft">{meta}</p>}
        {children}
        {actions && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-ink-faint">
            {actions}
          </div>
        )}
      </div>
    </Tag>
  );
}
