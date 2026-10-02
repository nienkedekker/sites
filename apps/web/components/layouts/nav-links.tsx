"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

const NAV_LINKS = [
  { href: "/stats", label: "Stats" },
  { href: "/search", label: "Search" },
  { href: "/about", label: "About" },
] as const;

export const navLinkClass =
  "block px-2 py-1.5 text-ink underline decoration-1 underline-offset-4 aria-[current=page]:no-underline sm:px-3";

export function NavLinks() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const links = isLoggedIn
    ? [...NAV_LINKS, { href: "/create", label: "Create" }]
    : NAV_LINKS;

  return (
    <ul className="flex items-center font-geist text-sm font-medium sm:gap-1">
      {links.map(({ href, label }) => (
        <li key={href}>
          <Link
            href={href}
            aria-current={pathname === href ? "page" : undefined}
            className={navLinkClass}
          >
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
