/**
 * Main types entry point - combines generated database types with our custom types
 */

// Re-export all database types (these get regenerated from Supabase)
export type {
  Json,
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  CompositeTypes,
} from "./database";

// Re-export our custom domain types
export type {
  ValidItemType,
  BaseItem,
  TypedItem,
  BookItem,
  MovieItem,
  ShowItem,
} from "./shared";

// Re-export type guards and validation functions
export {
  VALID_ITEM_TYPES,
  isValidItemType,
  isBookItem,
  isMovieItem,
  isShowItem,
  validateAndTypeItem,
} from "./shared";

// Database-derived types with better typing
export type Item = Database["public"]["Tables"]["items"]["Row"];
export type ItemInsert = Database["public"]["Tables"]["items"]["Insert"];
export type ItemUpdate = Database["public"]["Tables"]["items"]["Update"];

// Function return types
export type CumulativeItemEntry =
  Database["public"]["Functions"]["get_cumulative_item_counts"]["Returns"][number];

// Custom interfaces that use our validated types
export interface ItemCountEntry {
  itemtype: ValidItemType; // Use our validated type instead of database string
  total_count: number;
  current_year_count: number;
}

// Next.js specific types
export type Params = Promise<{ id: string }>;
export type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

// Import the Database type for use in derived types
import type { Database } from "./database";
import type { ValidItemType } from "./shared";
