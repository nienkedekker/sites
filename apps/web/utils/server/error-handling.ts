export function isNextRedirect(error: unknown): error is { digest: string } {
  return Boolean(
    error &&
    typeof error === "object" &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.includes("NEXT_REDIRECT"),
  );
}
