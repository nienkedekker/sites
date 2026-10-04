"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import UiNavLinks from "@nienke/ui/nav-links";
import { useAuth } from "@/providers/auth-provider";

const NAV_LINKS = [
  { href: "/stats", label: "Stats" },
  { href: "/search", label: "Search" },
  { href: "/up-next", label: "Up next" },
  { href: "/about", label: "About" },
] as const;

export function NavLinks() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const links = isLoggedIn
    ? [
        ...NAV_LINKS,
        { href: "/recs", label: "Recs" },
        { href: "/create", label: "Create" },
      ]
    : NAV_LINKS;

  return <UiNavLinks links={links} currentPath={pathname} as={Link} />;
}
