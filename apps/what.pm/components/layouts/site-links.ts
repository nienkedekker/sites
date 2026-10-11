export const SITE_LINKS = [
  { href: "/stats", label: "Stats" },
  { href: "/search", label: "Search" },
  { href: "/about", label: "About" },
] as const;

// Signed in, the header reads Stats, Search, Next, About, Create, with Next
// opening a menu: my list, finding more for it, and the server that fetches it
export const SIGNED_IN_START = [
  { href: "/stats", label: "Stats" },
  { href: "/search", label: "Search" },
] as const;

export const NEXT_LINKS = [
  { href: "/up-next", label: "Up next" },
  { href: "/discover", label: "Discover" },
  { href: "/nanami", label: "nanami" },
] as const;

export const SIGNED_IN_END = [
  { href: "/about", label: "About" },
  { href: "/create", label: "Create" },
] as const;
