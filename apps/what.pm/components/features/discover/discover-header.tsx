import Link from "next/link";
import PageHeader from "@nienke/ui/page-header";
import { hasRecs, hasUpcoming } from "@/utils/server/services";

// Both ways of finding what to read and watch next, under one header: new
// books, and picks from the log. A tab only shows when its service is set up
const TABS = [
  { href: "/discover", label: "New releases", shown: hasUpcoming },
  { href: "/discover/for-you", label: "For you", shown: hasRecs },
] as const;

export function DiscoverHeader({
  current,
  intro,
}: {
  current: (typeof TABS)[number]["href"];
  intro: string;
}) {
  const tabs = TABS.filter(({ shown }) => shown());
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
      <PageHeader intro={intro} className="">
        Discover
      </PageHeader>
      {/* The tabs are pages of their own, so each view has its own address */}
      {tabs.length > 1 && (
        <div
          role="tablist"
          aria-label="Discover"
          className="flex shrink-0 border border-rule font-mono text-xs"
        >
          {tabs.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              role="tab"
              aria-selected={href === current}
              className="px-3 py-2 text-ink transition-colors not-first:border-l not-first:border-rule hover:bg-panel-2 aria-selected:bg-ink aria-selected:text-paper"
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
