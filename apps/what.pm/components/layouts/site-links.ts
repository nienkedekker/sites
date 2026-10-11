export const SITE_LINKS = [
  { href: "/search", label: "Search" },
  { href: "/stats", label: "Stats" },
  { href: "/about", label: "About" },
] as const;

export const SIGNED_IN_LINKS = [
  { href: "/discover", label: "Discover" },
  ...SITE_LINKS,
] as const;

export const DISCOVER_LINKS = [
  { href: "/discover", label: "New releases" },
  { href: "/discover/for-you", label: "For you" },
] as const;

export const CREATE_LINK = { href: "/create", label: "Create" } as const;

export const isWithin = (pathname: string | null, href: string) =>
  pathname === href || Boolean(pathname?.startsWith(`${href}/`));
