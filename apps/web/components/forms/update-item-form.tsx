"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateItemAction } from "@/app/actions/items";
import { SubmitButton } from "./submit-button";
import { FormMessage, type Message } from "./form-message";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Item } from "@/types";
import {
  bookItemSchema,
  movieItemSchema,
  showItemSchema,
  type BookItemInput,
  type MovieItemInput,
  type ShowItemInput,
} from "@/utils/schemas/validation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { ITEM_TYPES } from "@/utils/constants/app";

interface UpdateItemFormProps {
  item: Item;
  message?: Message;
}

export default function UpdateItemForm({ item, message }: UpdateItemFormProps) {
  // Get the appropriate schema based on item type
  const getSchemaAndDefaults = () => {
    switch (item.itemtype) {
      case ITEM_TYPES.BOOK:
        return {
          schema: bookItemSchema,
          defaultValues: {
            itemtype: ITEM_TYPES.BOOK,
            title: item.title,
            publishedYear: item.published_year || 0,
            redo: item.redo || false,
            author: item.author || "",
          },
        };
      case ITEM_TYPES.MOVIE:
        return {
          schema: movieItemSchema,
          defaultValues: {
            itemtype: ITEM_TYPES.MOVIE,
            title: item.title,
            publishedYear: item.published_year || 0,
            redo: item.redo || false,
            director: item.director || "",
          },
        };
      case ITEM_TYPES.SHOW:
        return {
          schema: showItemSchema,
          defaultValues: {
            itemtype: ITEM_TYPES.SHOW,
            title: item.title,
            publishedYear: item.published_year || 0,
            redo: item.redo || false,
            season: item.season || 1,
          },
        };
      default:
        throw new Error(`Unknown item type: ${item.itemtype}`);
    }
  };

  const { schema, defaultValues } = getSchemaAndDefaults();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues,
    mode: "onBlur", // Enable validation on blur
  });

  const onSubmit = async (
    data: BookItemInput | MovieItemInput | ShowItemInput,
  ) => {
    // Convert react-hook-form data to FormData for server action
    const formData = new FormData();
    formData.append("id", item.id);
    formData.append("itemtype", item.itemtype);
    formData.append("title", data.title);
    formData.append("publishedYear", data.publishedYear.toString());
    formData.append("belongsToYear", item.belongs_to_year.toString());
    formData.append("redo", data.redo ? "on" : "");

    if ("author" in data && data.author) formData.append("author", data.author);
    if ("director" in data && data.director)
      formData.append("director", data.director);
    if ("season" in data && data.season)
      formData.append("season", data.season.toString());

    return updateItemAction(formData);
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {message && <FormMessage message={message} />}

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
                    value={field.value || ""}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                  value={field.value || ""}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value) || 0)
                  }
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
                  value={field.value || ""}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value) || 0)
                  }
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
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  {item.itemtype === ITEM_TYPES.BOOK
                    ? "This was a re-read"
                    : "This was a rewatch"}
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <SubmitButton>Update Item</SubmitButton>
      </form>
    </Form>
  );
}
