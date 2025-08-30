/**
 * Get the current year as a number
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Check if a year is valid (reasonable range for media items)
 */
export function isValidYear(year: number): boolean {
  const currentYear = getCurrentYear();
  const minYear = 1600; // Reasonable minimum for books/movies
  const maxYear = currentYear + 10; // Allow future dates

  return year >= minYear && year <= maxYear;
}
