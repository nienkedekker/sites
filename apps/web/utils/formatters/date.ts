/**
 * Format a date to display just the year
 */
export function formatYear(date: Date | string | number): string {
  const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return dateObj.getFullYear().toString();
}

/**
 * Format a date to a human-readable string
 */
export function formatDate(date: Date | string | number): string {
  const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

/**
 * Format a date to a short format
 */
export function formatShortDate(date: Date | string | number): string {
  const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

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
  const minYear = 1900; // Reasonable minimum for books/movies
  const maxYear = currentYear + 10; // Allow future dates
  
  return year >= minYear && year <= maxYear;
}

/**
 * Format a year range (e.g., "2020-2024")
 */
export function formatYearRange(startYear: number, endYear: number): string {
  return `${startYear}-${endYear}`;
}