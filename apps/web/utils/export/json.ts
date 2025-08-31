/**
 * JSON export utility for items data
 */

import type { TypedItem } from "@/types/shared";

/**
 * Export format for JSON data
 */
export interface ExportData {
  metadata: {
    exportDate: string;
    version: string;
    totalItems: number;
    itemTypes: {
      books: number;
      movies: number;
      shows: number;
    };
  };
  items: TypedItem[];
}

/**
 * Convert items to structured JSON export format
 */
export function itemsToJSON(items: TypedItem[]): ExportData {
  const now = new Date().toISOString();
  
  const itemCounts = items.reduce(
    (acc, item) => {
      switch (item.itemtype) {
        case "Book":
          acc.books++;
          break;
        case "Movie":
          acc.movies++;
          break;
        case "Show":
          acc.shows++;
          break;
      }
      return acc;
    },
    { books: 0, movies: 0, shows: 0 }
  );

  return {
    metadata: {
      exportDate: now,
      version: "1.0",
      totalItems: items.length,
      itemTypes: itemCounts,
    },
    items: items,
  };
}

/**
 * Generate filename for JSON export
 */
export function generateJSONFilename(prefix = "whatpm-export"): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `${prefix}-${timestamp}.json`;
}

/**
 * Create downloadable JSON string
 */
export function createJSONDownload(items: TypedItem[]): string {
  return JSON.stringify(itemsToJSON(items), null, 2);
}