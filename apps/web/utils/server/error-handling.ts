/**
 * Check if an error is a Next.js redirect and should be re-thrown
 * @param error - The error to check
 * @returns true if the error is a Next.js redirect
 */
export function isNextRedirect(error: unknown): error is { digest: string } {
  return Boolean(
    error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.includes("NEXT_REDIRECT"),
  );
}
