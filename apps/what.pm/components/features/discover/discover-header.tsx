import type { CSSProperties } from "react";
import Link from "next/link";
import PageHeader from "@nienke/ui/page-header";
import { hasUpcoming } from "@/utils/server/services";

// Both ways of finding what to read and watch next, under one header: new
// books, and picks from the log with up next. New releases only shows with a
// Hardcover token; For you always does, as up next lives there
const TABS = [
  { href: "/discover", label: "New releases", shown: hasUpcoming },
  { href: "/discover/for-you", label: "For you", shown: () => true },
] as const;

export function DiscoverHeader({
  current,
}: {
  current: (typeof TABS)[number]["href"];
}) {
  const tabs = TABS.filter(({ shown }) => shown());
  return (
    <div className="mb-8">
      <PageHeader className="">Discover</PageHeader>
      {/* In the intro's place, as plain words rather than a control. The tabs
          are pages of their own, so each view has its own address */}
      {tabs.length > 1 && (
        <div
          role="tablist"
          aria-label="Discover"
          className="rise mt-5 flex flex-wrap gap-x-8 gap-y-2 text-lg sm:text-xl"
          style={{ "--delay": "160ms" } as CSSProperties}
        >
          {tabs.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              role="tab"
              aria-selected={href === current}
              className="text-ink-soft underline decoration-transparent decoration-2 underline-offset-8 transition-colors hover:text-ink aria-selected:text-ink aria-selected:decoration-ink"
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
