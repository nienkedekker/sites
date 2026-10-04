// Parsing like a browser catches tricks that string checks miss, such as
// "/\t/evil.com" (browsers drop the tab and land on //evil.com).
const BASE = "http://localhost";

export function getSafeRedirectUrl(rawRedirect: string | null): string {
  if (!rawRedirect?.startsWith("/")) return "/";

  try {
    const url = new URL(rawRedirect, BASE);
    if (url.origin !== BASE) return "/";
    // "/.//evil.com" passes the origin check but normalises to "//evil.com"
    if (url.pathname.startsWith("//")) return "/";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}
