"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import UiNavLinks from "@nienke/ui/nav-links";
import { useAuth } from "@/providers/auth-provider";
import { isWithin, NextMenu } from "@/components/layouts/next-menu";
import {
  NEXT_LINKS,
  SIGNED_IN_END,
  SIGNED_IN_START,
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
  const next = NEXT_LINKS.filter(({ href }) => SHOWN[href]?.(features) ?? true);

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
            {SIGNED_IN_START.map((link) => (
              <NavItem key={link.href} {...link} pathname={pathname} />
            ))}
            <NextMenu links={next} pathname={pathname} />
            {SIGNED_IN_END.map((link) => (
              <NavItem key={link.href} {...link} pathname={pathname} />
            ))}
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
          {(isLoggedIn ? SIGNED_IN_START : SITE_LINKS).map((link) => (
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
                  Next
                </p>
                <ul className="mt-1">
                  {next.map((link) => (
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
              {SIGNED_IN_END.map((link) => (
                <MenuItem
                  key={link.href}
                  {...link}
                  pathname={pathname}
                  onPick={() => setOpen(false)}
                />
              ))}
            </>
          )}
        </ul>
      </div>
    </div>
  );
}

type Href = Parameters<typeof Link>[0]["href"];

// A header link, as @nienke/ui/nav-links draws them
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
        aria-current={pathname === href ? "page" : undefined}
        className="nav-link"
      >
        {label}
      </Link>
    </li>
  );
}

// A link in the phone menu; the pages under Next sit indented, without rules
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
