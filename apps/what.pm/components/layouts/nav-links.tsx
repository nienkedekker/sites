"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import UiNavLinks from "@nienke/ui/nav-links";
import { useAuth } from "@/providers/auth-provider";
import {
  CREATE_LINK,
  DISCOVER_LINKS,
  isWithin,
  SIGNED_IN_LINKS,
  SITE_LINKS,
} from "@/components/layouts/site-links";
import { NavMenu } from "@/components/layouts/nav-menu";
import { ThemeToggle } from "@/components/layouts/theme-toggle";

// The path is unknown while a dynamic route's shell prerenders, so the
// Suspense fallback renders these links with nothing marked current
export function NavLinks({ upcoming }: { upcoming: boolean }) {
  return <NavLinksFor pathname={usePathname()} upcoming={upcoming} />;
}

// upcoming: whether New releases is there, with a Hardcover token
export function NavLinksFor({
  pathname,
  upcoming,
}: {
  pathname: string | null;
  upcoming: boolean;
}) {
  const discover = DISCOVER_LINKS.filter(
    ({ href }) => upcoming || href !== "/discover",
  );
  const { isLoggedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuPathname, setMenuPathname] = useState(pathname);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
        {isLoggedIn ? (
          <ul className="nav-links">
            {SIGNED_IN_LINKS.map((link) =>
              link.href === "/discover" ? (
                <NavMenu
                  key={link.href}
                  label={link.label}
                  section={link.href}
                  links={discover}
                  pathname={pathname}
                />
              ) : (
                <NavItem key={link.href} {...link} pathname={pathname} />
              ),
            )}
            <li className="ml-2">
              <Link
                href={CREATE_LINK.href}
                aria-current={
                  isWithin(pathname, CREATE_LINK.href) ? "page" : undefined
                }
                className="block border border-rule px-3 py-1 transition-colors hover:bg-ink hover:text-paper aria-[current=page]:bg-ink aria-[current=page]:text-paper"
              >
                {CREATE_LINK.label}
              </Link>
            </li>
          </ul>
        ) : (
          <UiNavLinks
            links={SITE_LINKS}
            currentPath={pathname ?? ""}
            as={Link}
          />
        )}
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
          {(isLoggedIn ? SIGNED_IN_LINKS : SITE_LINKS).map((link) =>
            link.href === "/discover" ? (
              // On a phone, Discover's pages sit under it, indented
              <li key={link.href} className="py-3">
                <p className="text-ink">{link.label}</p>
                <ul className="mt-1">
                  {discover.map((page) => (
                    <MenuItem
                      key={page.href}
                      {...page}
                      pathname={pathname}
                      onPick={() => setOpen(false)}
                      nested
                    />
                  ))}
                </ul>
              </li>
            ) : (
              <MenuItem
                key={link.href}
                {...link}
                pathname={pathname}
                onPick={() => setOpen(false)}
              />
            ),
          )}
          {isLoggedIn && (
            <MenuItem
              {...CREATE_LINK}
              pathname={pathname}
              onPick={() => setOpen(false)}
            />
          )}
        </ul>
      </div>
    </div>
  );
}

type Href = Parameters<typeof Link>[0]["href"];

// A header link, as @nienke/ui/nav-links draws them, current on the pages
// under it too, so For you still marks Discover
function NavItem({
  href,
  label,
  pathname,
}: {
  href: Href & string;
  label: string;
  pathname: string | null;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={isWithin(pathname, href) ? "page" : undefined}
        className="nav-link"
      >
        {label}
      </Link>
    </li>
  );
}

// A link in the phone menu
function MenuItem({
  href,
  label,
  pathname,
  onPick,
  nested = false,
}: {
  href: Href & string;
  label: string;
  pathname: string | null;
  onPick: () => void;
  // Under a heading, indented and without a rule, and current only on
  // exactly its page, as For you is under New releases' address
  nested?: boolean;
}) {
  const current = nested ? pathname === href : isWithin(pathname, href);
  return (
    <li>
      <Link
        href={href}
        aria-current={current ? "page" : undefined}
        onClick={onPick}
        className={`block text-ink aria-[current=page]:text-ink-soft ${nested ? "py-2 pl-4" : "py-3"}`}
      >
        {label}
      </Link>
    </li>
  );
}
