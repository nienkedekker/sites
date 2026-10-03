import type { ElementType, ReactNode } from "react";
import { externalProps, isExternal } from "./external";

export interface FooterLink {
  href: string;
  label: string;
  icon?: ReactNode;
  ariaLabel?: string;
}

export interface FooterNav {
  label: string;
  links: readonly FooterLink[];
  extra?: ReactNode;
}

interface SiteFooterProps {
  navs: readonly FooterNav[];
  linkAs?: ElementType;
  top?: ReactNode;
  bottom?: ReactNode;
  className?: string;
}

function FooterAnchor({
  link: { href, label, icon, ariaLabel },
  linkAs,
}: {
  link: FooterLink;
  linkAs: ElementType;
}) {
  const external = isExternal(href);
  const Anchor = external ? "a" : linkAs;
  const name = ariaLabel && external ? `${ariaLabel}, opens in new tab` : ariaLabel;
  const newTab = external && !ariaLabel && (
    <span className="sr-only"> (opens in new tab)</span>
  );

  if (icon) {
    return (
      <Anchor
        href={href}
        aria-label={name}
        className="group flex items-center gap-1.5 transition-colors hover:text-ink"
        {...externalProps(href)}
      >
        {icon}
        <span className="link group-hover:decoration-ink">{label}</span>
        {newTab}
      </Anchor>
    );
  }

  return (
    <Anchor
      href={href}
      aria-label={name}
      className="link hover:text-ink"
      {...externalProps(href)}
    >
      {label}
      {newTab}
    </Anchor>
  );
}

export default function SiteFooter({
  navs,
  linkAs = "a",
  top,
  bottom,
  className = "mt-32",
}: SiteFooterProps) {
  return (
    <footer
      className={`border-t border-rule font-mono text-xs text-ink-soft ${className}`}
    >
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-6">
        {top}
        <div className="flex flex-wrap justify-between gap-x-8 gap-y-2">
          {navs.map(({ label, links, extra }) => (
            <nav key={label} aria-label={label}>
              <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {links.map((link) => (
                  <li key={link.href}>
                    <FooterAnchor link={link} linkAs={linkAs} />
                  </li>
                ))}
                {extra}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      {bottom}
    </footer>
  );
}
