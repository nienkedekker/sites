/**
 * CSV export utility for items data
 */

import type { TypedItem } from "@/types/shared";

/**
 * Convert items to CSV format
 */
export function itemsToCSV(items: TypedItem[]): string {
  if (items.length === 0) {
    return "No items to export";
  }

  const headers = [
    "Title",
    "Type",
    "Author",
    "Director",
    "Season",
    "Published Year",
    "Year Logged",
    "Re-read/Re-watched",
    "Created At",
    "Updated At",
  ];

  const csvRows = [
    headers.join(","),
    ...items.map((item) =>
      [
        `"${escapeCSVField(item.title)}"`,
        `"${item.itemtype}"`,
        `"${item.author || ""}"`,
        `"${item.director || ""}"`,
        item.season?.toString() || "",
        item.published_year.toString(),
        item.belongs_to_year.toString(),
        item.redo ? "Yes" : "No",
        `"${item.created_at || ""}"`,
        `"${item.updated_at || ""}"`,
      ].join(","),
    ),
  ];

  return csvRows.join("\n");
}

/**
 * Escape CSV field values to handle commas, quotes, and newlines
 */
function escapeCSVField(field: string): string {
  // Replace quotes with double quotes and handle other special characters
  return field.replace(/"/g, '""').replace(/\n/g, " ").replace(/\r/g, " ");
}

/**
 * Generate filename for CSV export
 */
export function generateCSVFilename(prefix = "whatpm-export"): string {
  const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  return `${prefix}-${timestamp}.csv`;
}
