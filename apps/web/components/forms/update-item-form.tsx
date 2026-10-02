"use client";

import { useMemo } from "react";
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
import { getCurrentYear } from "@/utils/formatters/date";
import { toNumber, formatNumberInputValue } from "@/utils/form";
import type { Item } from "@/types";

type AnyItemInput = BookItemInput | MovieItemInput | ShowItemInput;

interface UpdateItemFormProps {
  item: Item;
  onSaved: () => void;
}

export default function UpdateItemForm({ item, onSaved }: UpdateItemFormProps) {
  const { schema, defaultValues } = useMemo(
    () => getSchemaAndDefaults(item),
    [item],
  );

  const form = useForm<AnyItemInput>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onBlur",
  });

  const formErrors = Object.values(form.formState.errors);
  const hasErrors = formErrors.length > 0;

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

    const { error } = await updateItemAction(fd);
    if (error) {
      form.setError("root", { message: error });
      return;
    }
    onSaved();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {hasErrors &&
            `Form has ${formErrors.length} error${formErrors.length > 1 ? "s" : ""}. Please fix them before submitting.`}
        </div>

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
              name="author"
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
              name="director"
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
                name="season"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Season</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={formatNumberInputValue(field.value as number)}
                        onChange={(e) =>
                          field.onChange(toNumber(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="inProgress"
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
            name="publishedYear"
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
                    value={formatNumberInputValue(field.value)}
                    onChange={(e) => field.onChange(toNumber(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="belongsToYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Belongs To Year</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(toNumber(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="redo"
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

        <div className="mt-8 border-t border-line pt-6">
          {form.formState.errors.root && (
            <p role="alert" className="mb-4 text-sm text-danger">
              {form.formState.errors.root.message}
            </p>
          )}
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

function getSchemaAndDefaults(item: Item) {
  const currentYear = getCurrentYear();

  switch (item.itemtype) {
    case ITEM_TYPES.BOOK:
      return {
        schema: bookItemSchema,
        defaultValues: {
          itemtype: ITEM_TYPES.BOOK,
          title: item.title,
          belongsToYear: item.belongs_to_year ?? currentYear,
          publishedYear: item.published_year ?? currentYear,
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
          belongsToYear: item.belongs_to_year ?? currentYear,
          publishedYear: item.published_year ?? currentYear,
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
          belongsToYear: item.belongs_to_year ?? currentYear,
          publishedYear: item.published_year ?? currentYear,
          redo: !!item.redo,
          season: item.season ?? 1,
          inProgress: !!item.in_progress,
        },
      };
    default:
      throw new Error(`Unknown item type: ${item.itemtype}`);
  }
}
