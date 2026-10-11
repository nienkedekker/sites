export const SITE_LINKS = [
  { href: "/search", label: "Search" },
  { href: "/stats", label: "Stats" },
  { href: "/about", label: "About" },
] as const;

// Signed in, the header reads Discover, Up next, Search, Stats, About, then
// Create as a button. nanami is linked from the footer
export const SIGNED_IN_LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/up-next", label: "Up next" },
  ...SITE_LINKS,
] as const;

export const CREATE_LINK = { href: "/create", label: "Create" } as const;

// A page and everything under it, so For you still counts as Discover
export const isWithin = (pathname: string | null, href: string) =>
  pathname === href || Boolean(pathname?.startsWith(`${href}/`));
