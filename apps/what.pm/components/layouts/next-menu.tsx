"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { NEXT_LINKS } from "@/components/layouts/site-links";

type NextLink = (typeof NEXT_LINKS)[number];

// A page and everything under it, so /nanami/downloads still counts as nanami
export const isWithin = (pathname: string | null, href: string) =>
  pathname === href || Boolean(pathname?.startsWith(`${href}/`));

// "Next" in the header: a button that shows the pages under it, closing again
// on Escape, a click elsewhere, or going to another page
export function NextMenu({
  links,
  pathname,
}: {
  links: readonly NextLink[];
  pathname: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  const itemRef = useRef<HTMLLIElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const inside = links.some(({ href }) => isWithin(pathname, href));

  if (pathname !== openedAt) {
    setOpenedAt(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!itemRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <li ref={itemRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={menuId}
        className={`nav-link flex cursor-pointer items-center gap-1 ${inside ? "no-underline" : ""}`}
      >
        Next
        <ChevronDown
          className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      <ul
        id={menuId}
        hidden={!open}
        className="own-grain absolute left-0 top-full mt-1 min-w-40 border border-rule bg-paper py-1"
      >
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={isWithin(pathname, href) ? "page" : undefined}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-ink hover:bg-panel-2 aria-[current=page]:text-ink-soft"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}
