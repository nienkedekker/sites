import Link from "next/link";
import SiteFooter from "@nienke/ui/site-footer";
import { AccountLinks } from "@/components/layouts/account-links";
import { SITE_LINKS } from "@/components/layouts/site-links";

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4.5 3.75h4.5l10.5 16.5H15Z" />
      <path d="M10.68 13.46 4.5 20.25" />
      <path d="M19.5 3.75l-6.18 6.79" />
    </svg>
  );
}

export default function Footer() {
  return (
    <SiteFooter
      linkAs={Link}
      navs={[
        {
          label: "Site",
          links: SITE_LINKS,
          extra: (
            <li>
              <a href="/feed.xml" className="link hover:text-ink">
                RSS
              </a>
            </li>
          ),
        },
        { label: "Account", links: [], extra: <AccountLinks /> },
        {
          label: "Elsewhere",
          links: [
            { href: "https://nienke.dev", label: "nienke.dev" },
            {
              href: "https://x.com/thanergic",
              label: "@thanergic",
              ariaLabel: "@thanergic on X",
              icon: <XIcon className="size-3.5 shrink-0" />,
            },
          ],
        },
      ]}
    />
  );
}
