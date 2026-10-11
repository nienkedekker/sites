import Link from "next/link";
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
    <PageHeader tabs={{ label: "nanami", links: PAGES, current, as: Link }}>
      nanami
    </PageHeader>
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
