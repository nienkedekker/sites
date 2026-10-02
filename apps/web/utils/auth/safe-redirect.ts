const ALLOWED_REDIRECT_PREFIXES = [
  "/",
  "/year/",
  "/stats",
  "/search",
  "/about",
  "/export",
  "/create",
];

export function getSafeRedirectUrl(rawRedirect: string | null): string {
  if (!rawRedirect) return "/";

  if (
    !rawRedirect.startsWith("/") ||
    rawRedirect.startsWith("//") ||
    rawRedirect.includes("\\")
  ) {
    return "/";
  }

  const isAllowed = ALLOWED_REDIRECT_PREFIXES.some(
    (prefix) => rawRedirect === prefix || rawRedirect.startsWith(prefix),
  );

  return isAllowed ? rawRedirect : "/";
}
