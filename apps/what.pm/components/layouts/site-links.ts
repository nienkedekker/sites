export const SITE_LINKS = [
  { href: "/search", label: "Search" },
  { href: "/stats", label: "Stats" },
  { href: "/about", label: "About" },
] as const;

// Signed in, the header reads Discover, Search, Stats, About, More, then
// Create as a button, with More opening a menu: my list, and the server that
// fetches it
export const SIGNED_IN_LINKS = [
  { href: "/discover", label: "Discover" },
  ...SITE_LINKS,
] as const;

export const MORE_LINKS = [
  { href: "/up-next", label: "Up next" },
  { href: "/nanami", label: "nanami" },
] as const;

export const CREATE_LINK = { href: "/create", label: "Create" } as const;
