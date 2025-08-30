/**
 * Check if an error is a Next.js redirect and should be re-thrown
 * @param error - The error to check
 * @returns true if the error is a Next.js redirect
 */
export function isNextRedirect(error: unknown): error is { digest: string } {
  return Boolean(
    error &&
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as any).digest === 'string' &&
    (error as any).digest.includes('NEXT_REDIRECT')
  );
}

/**
 * Handle errors in server actions by re-throwing redirects and logging actual errors
 * @param error - The error to handle
 * @param context - Context for logging (e.g., "createItemAction")
 * @param fallbackMessage - User-friendly error message for actual errors
 * @throws Re-throws Next.js redirects
 */
export function handleServerActionError(
  error: unknown, 
  context: string, 
  fallbackMessage?: string
): never {
  // Allow Next.js redirects to bubble up
  if (isNextRedirect(error)) {
    throw error;
  }
  
  // Log actual errors
  console.error(`Unexpected error in ${context}:`, error);
  
  // This function should be used in a context where an error response is returned
  // The caller should handle the return value appropriately
  throw new Error(fallbackMessage || "Something went wrong. Please try again.");
}