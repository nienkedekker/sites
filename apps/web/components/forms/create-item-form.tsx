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
  FormMessage,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

import { SubmitButton } from "./submit-button";
import { PageHeader } from "@/components/ui/page-header";

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

export default function CreateItemForm() {
  const [activeTab, setActiveTab] = useState<TabValue>(TAB_VALUES.BOOK);

  const { schema, defaults } = useMemo(
    () => getSchemaAndDefaults(activeTab),
    [activeTab],
  );

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
      <PageHeader className="mb-8">Add New Item</PageHeader>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800/50 border-0 p-1 rounded-lg">
          <TabsTrigger
            value={TAB_VALUES.BOOK}
            className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm text-gray-600 dark:text-gray-400 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100"
          >
            Book
          </TabsTrigger>
          <TabsTrigger
            value={TAB_VALUES.MOVIE}
            className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm text-gray-600 dark:text-gray-400 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100"
          >
            Movie
          </TabsTrigger>
          <TabsTrigger
            value={TAB_VALUES.SHOW}
            className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm text-gray-600 dark:text-gray-400 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100"
          >
            TV Show
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-8 space-y-6">
          {/* key={activeTab} forces a fresh RHF form when switching tabs */}
          <Form key={activeTab} {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  <FormItem className="flex flex-row items-start">
                    <FormControl>
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                      />
                    </FormControl>
                    <FormLabel>
                      {activeTab === TAB_VALUES.BOOK
                        ? "This was a re-read"
                        : "This was a rewatch"}
                    </FormLabel>
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
