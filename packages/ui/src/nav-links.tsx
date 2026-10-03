import type { ElementType } from "react";

interface NavLinksProps {
  links: readonly { href: string; label: string }[];
  currentPath: string;
  as?: ElementType;
  linkProps?: Record<string, unknown>;
}

export default function NavLinks({
  links,
  currentPath,
  as: Anchor = "a",
  linkProps,
}: NavLinksProps) {
  return (
    <ul className="nav-links">
      {links.map(({ href, label }) => (
        <li key={href}>
          <Anchor
            href={href}
            aria-current={currentPath === href ? "page" : undefined}
            className="nav-link"
            {...linkProps}
          >
            {label}
          </Anchor>
        </li>
      ))}
    </ul>
  );
}
