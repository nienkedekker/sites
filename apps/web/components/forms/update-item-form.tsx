"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { updateItemAction } from "@/app/actions/items";
import { SubmitButton } from "./submit-button";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormMessage,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

import {
  bookItemSchema,
  movieItemSchema,
  showItemSchema,
  type BookItemInput,
  type MovieItemInput,
  type ShowItemInput,
} from "@/utils/schemas/validation";
import { ITEM_TYPES } from "@/utils/constants/app";
import { formStyles } from "@/utils/styles";
import type { Item } from "@/types";

type AnyItemInput = BookItemInput | MovieItemInput | ShowItemInput;

interface UpdateItemFormProps {
  item: Item;
}

// NOTE: single form that adapts to the itemtype, with belongsToYear editable
export default function UpdateItemForm({ item }: UpdateItemFormProps) {
  const { schema, defaultValues } = getSchemaAndDefaults(item);

  const form = useForm<AnyItemInput>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onBlur",
  });

  const toNum = (v: string) => (v === "" ? 0 : parseInt(v, 10) || 0);

  const onSubmit = async (data: AnyItemInput) => {
    const fd = new FormData();
    fd.append("id", item.id);
    fd.append("itemtype", data.itemtype);
    fd.append("title", data.title);
    fd.append("publishedYear", String(data.publishedYear));
    fd.append("belongsToYear", String(data.belongsToYear));
    fd.append("redo", data.redo ? "on" : "");

    if ("author" in data && data.author) fd.append("author", data.author);
    if ("director" in data && data.director)
      fd.append("director", data.director);
    if ("season" in data && data.season)
      fd.append("season", String(data.season));
    if ("inProgress" in data && data.inProgress) fd.append("inProgress", "on");

    return updateItemAction(fd);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={formStyles.container}
      >
        <div className="space-y-5">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {item.itemtype === ITEM_TYPES.BOOK && (
            <FormField
              control={form.control}
              name={"author" as const}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Author</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {item.itemtype === ITEM_TYPES.MOVIE && (
            <FormField
              control={form.control}
              name={"director" as const}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Director</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {item.itemtype === ITEM_TYPES.SHOW && (
            <>
              <FormField
                control={form.control}
                name={"season" as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Season</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(toNum(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={"inProgress" as const}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">
                      Currently watching (in progress)
                    </FormLabel>
                  </FormItem>
                )}
              />
            </>
          )}

          <FormField
            control={form.control}
            name={"publishedYear" as const}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {item.itemtype === ITEM_TYPES.BOOK
                    ? "Published Year"
                    : "Release Year"}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(toNum(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* NEW: editable belongsToYear (was fixed before) */}
          <FormField
            control={form.control}
            name={"belongsToYear" as const}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Belongs To Year</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(toNum(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={"redo" as const}
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={!!field.value}
                    onCheckedChange={(v) => field.onChange(Boolean(v))}
                  />
                </FormControl>
                <FormLabel className="!mt-0">
                  {item.itemtype === ITEM_TYPES.BOOK
                    ? "This was a re-read"
                    : "This was a rewatch"}
                </FormLabel>
              </FormItem>
            )}
          />
        </div>

        <div className="pt-6 mt-6 border-t border-neutral-200/50 dark:border-neutral-700/50">
          <SubmitButton
            isSubmitting={form.formState.isSubmitting}
            className="w-full"
          >
            Update Item
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
}

/** Picks schema + defaults per itemtype, including belongsToYear */
function getSchemaAndDefaults(item: Item) {
  switch (item.itemtype) {
    case ITEM_TYPES.BOOK:
      return {
        schema: bookItemSchema,
        defaultValues: {
          itemtype: ITEM_TYPES.BOOK,
          title: item.title,
          belongsToYear: item.belongs_to_year ?? new Date().getFullYear(),
          publishedYear: item.published_year ?? new Date().getFullYear(),
          redo: !!item.redo,
          author: item.author ?? "",
        },
      };
    case ITEM_TYPES.MOVIE:
      return {
        schema: movieItemSchema,
        defaultValues: {
          itemtype: ITEM_TYPES.MOVIE,
          title: item.title,
          belongsToYear: item.belongs_to_year ?? new Date().getFullYear(),
          publishedYear: item.published_year ?? new Date().getFullYear(),
          redo: !!item.redo,
          director: item.director ?? "",
        },
      };
    case ITEM_TYPES.SHOW:
      return {
        schema: showItemSchema,
        defaultValues: {
          itemtype: ITEM_TYPES.SHOW,
          title: item.title,
          belongsToYear: item.belongs_to_year ?? new Date().getFullYear(),
          publishedYear: item.published_year ?? new Date().getFullYear(),
          redo: !!item.redo,
          season: item.season ?? 1,
          inProgress: !!item.in_progress,
        },
      };
    default:
      throw new Error(`Unknown item type: ${item.itemtype}`);
  }
}
