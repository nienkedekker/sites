import Link from "next/link";
import { XLogo } from "@phosphor-icons/react/ssr";
import SiteFooter from "@nienke/ui/site-footer";
import { AccountLinks } from "@/components/layouts/account-links";
import { SITE_LINKS } from "@/components/layouts/site-links";
import { IS_MINE, OWNER_URL } from "@/utils/constants/site";
import { hasNanami } from "@/utils/server/services";

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
        {
          label: "Account",
          links: [],
          extra: <AccountLinks nanami={hasNanami()} />,
        },
        {
          label: "Elsewhere",
          links: [
            { href: OWNER_URL, label: new URL(OWNER_URL).host },
            ...(IS_MINE
              ? [
                  {
                    href: "https://x.com/thanergic",
                    label: "@thanergic",
                    ariaLabel: "@thanergic on X",
                    icon: (
                      <XLogo className="size-3.5 shrink-0" aria-hidden="true" />
                    ),
                  },
                ]
              : []),
          ],
        },
      ]}
    />
  );
}
