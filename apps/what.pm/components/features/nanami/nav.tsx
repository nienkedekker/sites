import Link from "next/link";
import UiNavLinks from "@nienke/ui/nav-links";
import PageHeader from "@nienke/ui/page-header";

const PAGES = [
  { href: "/nanami", label: "Status" },
  { href: "/nanami/downloads", label: "Downloads" },
] as const;

export function NanamiHeader({
  current,
}: {
  current: (typeof PAGES)[number]["href"];
}) {
  return (
    <>
      <PageHeader className="mb-8">nanami</PageHeader>
      <nav aria-label="nanami" className="mb-8">
        <UiNavLinks links={PAGES} currentPath={current} as={Link} />
      </nav>
    </>
  );
}

export function NanamiSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className="framed h-20 bg-panel"
    />
  );
}
