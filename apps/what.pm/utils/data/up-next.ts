import { cacheLife, cacheTag } from "next/cache";
import { supabasePublic } from "@/utils/supabase/public";
import { getAllItems } from "@/utils/data/items";
import { isLogged, logIndex } from "@/utils/data/recommend";
import { ITEMS_TAG, WANTED_TAG } from "@/utils/constants/app";
import { VALID_ITEM_TYPES, type ValidItemType } from "@/types/shared";

export interface UpNextItem {
  itemtype: ValidItemType;
  external_id: string;
  title: string;
  creator: string | null;
  published_year: number | null;
}

export async function getUpNext(): Promise<UpNextItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(ITEMS_TAG, WANTED_TAG);
  const [items, { data, error }] = await Promise.all([
    getAllItems(),
    supabasePublic
      .from("wanted")
      .select("itemtype, external_id, title, creator, published_year")
      .order("created_at", { ascending: false }),
  ]);
  if (error) throw new Error(error.message);
  const logged = logIndex(items);
  return (data ?? []).filter(
    (item): item is UpNextItem =>
      VALID_ITEM_TYPES.includes(item.itemtype as ValidItemType) &&
      !isLogged(item, logged),
  );
}
