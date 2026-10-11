"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import UiNavLinks from "@nienke/ui/nav-links";
import { useAuth } from "@/providers/auth-provider";
import { isWithin, MoreMenu } from "@/components/layouts/more-menu";
import {
  CREATE_LINK,
  MORE_LINKS,
  SIGNED_IN_LINKS,
  SITE_LINKS,
} from "@/components/layouts/site-links";
import { ThemeToggle } from "@/components/layouts/theme-toggle";

// The path is unknown while a dynamic route's shell prerenders, so the
// Suspense fallback renders these links with nothing marked current
export function NavLinks(props: Features) {
  return <NavLinksFor pathname={usePathname()} {...props} />;
}

// Which optional pages have what they need, from the server: an Anthropic key
// for recs, a media server pushing reports for nanami, a Hardcover token for
// recent books
interface Features {
  recs: boolean;
  nanami: boolean;
  upcoming: boolean;
}

// Discover shows with either of its tabs
const SHOWN: Record<string, (features: Features) => boolean> = {
  "/discover": ({ recs, upcoming }) => recs || upcoming,
  "/nanami": ({ nanami }) => nanami,
};

export function NavLinksFor({
  pathname,
  ...features
}: Features & { pathname: string | null }) {
  const { isLoggedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuPathname, setMenuPathname] = useState(pathname);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const shown = ({ href }: { href: string }) => SHOWN[href]?.(features) ?? true;
  const links = SIGNED_IN_LINKS.filter(shown);
  const more = MORE_LINKS.filter(shown);

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
            {links.map((link) => (
              <NavItem key={link.href} {...link} pathname={pathname} />
            ))}
            <MoreMenu links={more} pathname={pathname} />
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
          {(isLoggedIn ? links : SITE_LINKS).map((link) => (
            <MenuItem
              key={link.href}
              {...link}
              pathname={pathname}
              onPick={() => setOpen(false)}
            />
          ))}
          {isLoggedIn && (
            <>
              <li className="py-3">
                <p className="font-mono text-xs uppercase tracking-[0.06em] text-ink-faint">
                  More
                </p>
                <ul className="mt-1">
                  {more.map((link) => (
                    <MenuItem
                      key={link.href}
                      {...link}
                      pathname={pathname}
                      onPick={() => setOpen(false)}
                      nested
                    />
                  ))}
                </ul>
              </li>
              <MenuItem
                {...CREATE_LINK}
                pathname={pathname}
                onPick={() => setOpen(false)}
              />
            </>
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

// A link in the phone menu; the pages under More sit indented, without rules
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
  nested?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={isWithin(pathname, href) ? "page" : undefined}
        onClick={onPick}
        className={`block text-ink aria-[current=page]:text-ink-soft ${nested ? "py-2 pl-4" : "py-3"}`}
      >
        {label}
      </Link>
    </li>
  );
}
