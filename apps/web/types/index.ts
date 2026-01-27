import type { Database } from "./database";
import type { ValidItemType } from "./shared";

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

// Database-derived types with better typing
export type Item = Database["public"]["Tables"]["items"]["Row"];
export type ItemInsert = Database["public"]["Tables"]["items"]["Insert"];
export type ItemUpdate = Database["public"]["Tables"]["items"]["Update"];

// Custom interfaces that use our validated types
export interface ItemCountEntry {
  itemtype: ValidItemType; // Use our validated type instead of database string
  total_count: number;
  current_year_count: number;
}

// Next.js specific types
export type Params = Promise<{ id: string }>;
