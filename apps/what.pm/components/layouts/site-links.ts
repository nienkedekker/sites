export const SITE_LINKS = [
  { href: "/search", label: "Search" },
  { href: "/stats", label: "Stats" },
  { href: "/about", label: "About" },
] as const;

// Signed in, the header reads Discover, Search, Stats, About, then Create as
// a button. Up next is on Discover's For you; nanami is linked from the footer
export const SIGNED_IN_LINKS = [
  { href: "/discover", label: "Discover" },
  ...SITE_LINKS,
] as const;

// Discover opens a menu of its two pages; New releases needs a Hardcover token
export const DISCOVER_LINKS = [
  { href: "/discover", label: "New releases" },
  { href: "/discover/for-you", label: "For you" },
] as const;

export const CREATE_LINK = { href: "/create", label: "Create" } as const;

// A page and everything under it, so For you still counts as Discover
export const isWithin = (pathname: string | null, href: string) =>
  pathname === href || Boolean(pathname?.startsWith(`${href}/`));
