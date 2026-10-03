"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

const NAV_LINKS = [
  { href: "/stats", label: "Stats" },
  { href: "/search", label: "Search" },
  { href: "/about", label: "About" },
] as const;

export function NavLinks() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const links = isLoggedIn
    ? [...NAV_LINKS, { href: "/create", label: "Create" }]
    : NAV_LINKS;

  return (
    <ul className="nav-links">
      {links.map(({ href, label }) => (
        <li key={href}>
          <Link
            href={href}
            aria-current={pathname === href ? "page" : undefined}
            className="nav-link"
          >
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
