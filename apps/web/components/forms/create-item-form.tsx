// components/forms/create-item-form.tsx
"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormMessage, // field-level message (shadcn)
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

import { SubmitButton } from "./submit-button";
import { FormMessage as BannerMessage, type Message } from "./form-message"; // top-of-form banner

import { createItemAction } from "@/app/actions/items";
import {
  bookItemSchema,
  movieItemSchema,
  showItemSchema,
  type BookItemInput,
  type MovieItemInput,
  type ShowItemInput,
} from "@/utils/schemas/validation";
import { TAB_VALUES, type TabValue } from "@/utils/constants/app";

type AnyCreateInput = BookItemInput | MovieItemInput | ShowItemInput;

interface CreateItemFormProps {
  message?: Message;
}

export default function CreateItemForm({ message }: CreateItemFormProps) {
  const [activeTab, setActiveTab] = useState<TabValue>(TAB_VALUES.BOOK);

  const { schema, defaults } = useMemo(
    () => getSchemaAndDefaults(activeTab),
    [activeTab],
  );

  // One RHF instance at a time (keyed by activeTab so resolver/defaults swap cleanly)
  const form = useForm<AnyCreateInput>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
    mode: "onBlur",
  });

  const toNum = (v: string) => (v === "" ? 0 : parseInt(v, 10) || 0);

  const onSubmit = async (data: AnyCreateInput) => {
    const fd = new FormData();
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

    return createItemAction(fd);
  };

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add New Item</h1>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value={TAB_VALUES.BOOK}>Book</TabsTrigger>
          <TabsTrigger value={TAB_VALUES.MOVIE}>Movie</TabsTrigger>
          <TabsTrigger value={TAB_VALUES.SHOW}>TV Show</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-4">
          {/* key={activeTab} forces a fresh RHF form when switching tabs */}
          <Form key={activeTab} {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {message && <BannerMessage message={message} />}

              <FormField
                control={form.control}
                name={"title" as const}
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

              {/* Discriminated fields */}
              {activeTab === TAB_VALUES.BOOK && (
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

              {activeTab === TAB_VALUES.MOVIE && (
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

              {activeTab === TAB_VALUES.SHOW && (
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
                          onChange={(e) =>
                            field.onChange(toNum(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Common fields */}
              <FormField
                control={form.control}
                name={"publishedYear" as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {activeTab === TAB_VALUES.BOOK
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
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        {activeTab === TAB_VALUES.BOOK
                          ? "This was a re-read"
                          : "This was a rewatch"}
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <SubmitButton isSubmitting={form.formState.isSubmitting}>
                {activeTab === TAB_VALUES.BOOK
                  ? "Save book"
                  : activeTab === TAB_VALUES.MOVIE
                    ? "Save movie"
                    : "Save show"}
              </SubmitButton>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </main>
  );
}

/** Schema + defaults per tab (used to configure RHF each time the tab changes) */
function getSchemaAndDefaults(tab: TabValue) {
  const year = new Date().getFullYear();

  switch (tab) {
    case TAB_VALUES.BOOK:
      return {
        schema: bookItemSchema,
        defaults: {
          itemtype: "Book" as const,
          title: "",
          belongsToYear: year,
          publishedYear: year,
          redo: false,
          author: "",
        } satisfies BookItemInput,
      };
    case TAB_VALUES.MOVIE:
      return {
        schema: movieItemSchema,
        defaults: {
          itemtype: "Movie" as const,
          title: "",
          belongsToYear: year,
          publishedYear: year,
          redo: false,
          director: "",
        } satisfies MovieItemInput,
      };
    case TAB_VALUES.SHOW:
    default:
      return {
        schema: showItemSchema,
        defaults: {
          itemtype: "Show" as const,
          title: "",
          belongsToYear: year,
          publishedYear: year,
          redo: false,
          season: 1,
        } satisfies ShowItemInput,
      };
  }
}
