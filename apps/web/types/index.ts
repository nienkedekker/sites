import type { Database } from "./database";
import type { ValidItemType } from "./shared";

export type {
  Json,
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  CompositeTypes,
} from "./database";

export type {
  ValidItemType,
  BaseItem,
  TypedItem,
  BookItem,
  MovieItem,
  ShowItem,
} from "./shared";

export type Item = Database["public"]["Tables"]["items"]["Row"];
export type ItemInsert = Database["public"]["Tables"]["items"]["Insert"];
export type ItemUpdate = Database["public"]["Tables"]["items"]["Update"];

export interface ItemCountEntry {
  itemtype: ValidItemType;
  total_count: number;
  current_year_count: number;
}
