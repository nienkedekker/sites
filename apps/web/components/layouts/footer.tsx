import Link from "next/link";
import { AccountLinks } from "@/components/layouts/account-links";
import { linkStyles } from "@/utils/styles";

const SITE_LINKS = [
  { href: "/stats", label: "Stats" },
  { href: "/search", label: "Search" },
  { href: "/about", label: "About" },
] as const;

/**
 * The X logo, drawn like the lucide icons used elsewhere (24px grid, 2px
 * round strokes), since lucide has no brand icons. After Phosphor's XLogo.
 */
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
    <footer className="mt-32 border-t border-rule font-mono text-xs text-ink-soft">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-wrap justify-between gap-x-8 gap-y-2">
          <nav aria-label="Site">
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {SITE_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className={linkStyles.footer}>
                    {label}
                  </Link>
                </li>
              ))}
              <AccountLinks />
            </ul>
          </nav>
          <nav aria-label="Elsewhere">
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <li>
                <a
                  href="https://nienke.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkStyles.footer}
                >
                  nienke.dev
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/thanergic"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="@thanergic on X"
                  className="group flex items-center gap-1.5 transition-colors hover:text-ink"
                >
                  <XIcon className="size-3.5 shrink-0" />
                  <span className="underline decoration-line-strong underline-offset-4 transition-colors group-hover:decoration-ink">
                    @thanergic
                  </span>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
