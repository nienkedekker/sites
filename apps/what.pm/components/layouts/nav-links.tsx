"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import UiNavLinks from "@nienke/ui/nav-links";
import { useAuth } from "@/providers/auth-provider";
import { SIGNED_IN_LINKS, SITE_LINKS } from "@/components/layouts/site-links";
import { ThemeToggle } from "@/components/layouts/theme-toggle";

// The path is unknown while a dynamic route's shell prerenders, so the
// Suspense fallback renders these links with nothing marked current
export function NavLinks() {
  return <NavLinksFor pathname={usePathname()} />;
}

export function NavLinksFor({ pathname }: { pathname: string | null }) {
  const { isLoggedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuPathname, setMenuPathname] = useState(pathname);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const links = isLoggedIn ? SIGNED_IN_LINKS : SITE_LINKS;

  if (pathname !== menuPathname) {
    setMenuPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <div className="hidden md:block">
        <UiNavLinks links={links} currentPath={pathname ?? ""} as={Link} />
      </div>
      <ThemeToggle />
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="icon-button md:hidden"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label="Menu"
      >
        {open ? (
          <X className="size-4" aria-hidden="true" />
        ) : (
          <Menu className="size-4" aria-hidden="true" />
        )}
      </button>

      <div
        id="mobile-menu"
        hidden={!open}
        className="own-grain absolute inset-x-0 top-full border-b border-rule bg-paper md:hidden"
      >
        <ul className="mx-auto max-w-6xl divide-y divide-rule px-4 font-geist text-base font-medium">
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                onClick={() => setOpen(false)}
                className="block py-3 text-ink aria-[current=page]:text-ink-soft"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
