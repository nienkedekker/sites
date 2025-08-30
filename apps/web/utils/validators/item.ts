import { ITEM_TYPES, type ValidItemType } from "@/utils/constants/app";
import { isValidYear } from "@/utils/formatters/date";

/**
 * Validation result type
 */
export type ValidationResult = {
  success: boolean;
  errors: string[];
};

/**
 * Item creation validation
 */
export function validateItemCreation(data: {
  title: string;
  itemtype: string;
  publishedYear: number;
  author?: string;
  director?: string;
  season?: number;
}): ValidationResult {
  const errors: string[] = [];

  // Title validation
  if (!data.title || data.title.trim().length === 0) {
    errors.push("Title is required");
  } else if (data.title.trim().length > 200) {
    errors.push("Title must be 200 characters or less");
  }

  // Item type validation
  const validTypes = Object.values(ITEM_TYPES);
  if (!validTypes.includes(data.itemtype as ValidItemType)) {
    errors.push("Invalid item type");
  }

  // Published year validation
  if (!data.publishedYear || !isValidYear(data.publishedYear)) {
    errors.push("Published year must be a valid year between 1900 and 10 years in the future");
  }

  // Type-specific validation
  if (data.itemtype === ITEM_TYPES.BOOK) {
    if (!data.author || data.author.trim().length === 0) {
      errors.push("Author is required for books");
    } else if (data.author.trim().length > 100) {
      errors.push("Author must be 100 characters or less");
    }
  }

  if (data.itemtype === ITEM_TYPES.MOVIE) {
    if (!data.director || data.director.trim().length === 0) {
      errors.push("Director is required for movies");
    } else if (data.director.trim().length > 100) {
      errors.push("Director must be 100 characters or less");
    }
  }

  if (data.itemtype === ITEM_TYPES.SHOW) {
    if (!data.season || data.season < 1 || data.season > 50) {
      errors.push("Season must be a number between 1 and 50");
    }
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Email validation
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Password validation
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password) {
    errors.push("Password is required");
  } else {
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (password.length > 128) {
      errors.push("Password must be 128 characters or less");
    }
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Search query validation
 */
export function validateSearchQuery(query: string): ValidationResult {
  const errors: string[] = [];

  if (!query || query.trim().length === 0) {
    errors.push("Search query is required");
  } else if (query.trim().length < 2) {
    errors.push("Search query must be at least 2 characters long");
  } else if (query.trim().length > 100) {
    errors.push("Search query must be 100 characters or less");
  }

  return {
    success: errors.length === 0,
    errors,
  };
}