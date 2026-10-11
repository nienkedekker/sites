"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { isWithin } from "@/components/layouts/site-links";

type Href = Parameters<typeof Link>[0]["href"];

export function NavMenu({
  label,
  section,
  links,
  pathname,
}: {
  label: string;
  section: string;
  links: readonly { href: Href & string; label: string }[];
  pathname: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  const itemRef = useRef<HTMLLIElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const inside = isWithin(pathname, section);

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
        className={`nav-link flex cursor-pointer items-center gap-1 ${inside ? "underline decoration-2" : ""}`}
      >
        {label}
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
              // Exactly this page: For you is under New releases' address
              aria-current={pathname === href ? "page" : undefined}
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
