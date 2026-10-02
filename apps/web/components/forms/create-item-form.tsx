"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { TitleAutocomplete } from "./title-autocomplete";
import PageHeader from "@nienke/ui/page-header";

import { createItemAction } from "@/app/actions/items";
import { getSeasonYears } from "@/app/actions/external-search";
import type { ExternalResult, SeasonYears } from "@/types/external-api";
import {
  bookItemSchema,
  movieItemSchema,
  showItemSchema,
  type BookItemInput,
  type MovieItemInput,
  type ShowItemInput,
} from "@/utils/schemas/validation";
import { TAB_VALUES, ITEM_TYPES, type TabValue } from "@/utils/constants/app";
import { formStyles } from "@/utils/styles";
import { getCurrentYear } from "@/utils/formatters/date";
import { toNumber, formatNumberInputValue } from "@/utils/form";

type AnyCreateInput = BookItemInput | MovieItemInput | ShowItemInput;

function FormComponent({ activeTab }: { activeTab: TabValue }) {
  const { schema, defaults } = useMemo(
    () => getSchemaAndDefaults(activeTab),
    [activeTab],
  );

  const form = useForm<AnyCreateInput>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
    mode: "onBlur",
  });

  const [seasonYears, setSeasonYears] = useState<{
    title: string;
    years: SeasonYears;
  } | null>(null);
  const title = form.watch("title");
  const season = form.watch("season");

  useEffect(() => {
    if (!seasonYears || seasonYears.title !== title || !season) return;
    const year = seasonYears.years[season];
    if (year) form.setValue("publishedYear", year, { shouldValidate: true });
  }, [seasonYears, title, season, form]);

  const handleSelect = async (result: ExternalResult) => {
    const options = { shouldValidate: true, shouldDirty: true };
    form.setValue("title", result.title, options);
    if (result.year) form.setValue("publishedYear", result.year, options);
    if (result.creator && activeTab === TAB_VALUES.BOOK) {
      form.setValue("author", result.creator, options);
    }
    if (result.creator && activeTab === TAB_VALUES.MOVIE) {
      form.setValue("director", result.creator, options);
    }
    if (activeTab === TAB_VALUES.SHOW) {
      const years = await getSeasonYears(result.id);
      setSeasonYears({ title: result.title, years });
    }
  };

  const formErrors = Object.values(form.formState.errors);
  const hasErrors = formErrors.length > 0;

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
    if ("inProgress" in data && data.inProgress) fd.append("inProgress", "on");

    return createItemAction(fd);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={formStyles.container}
      >
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
                  <TitleAutocomplete
                    {...field}
                    itemType={defaults.itemtype}
                    onSelect={handleSelect}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {activeTab === TAB_VALUES.BOOK && (
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

          {activeTab === TAB_VALUES.MOVIE && (
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

          {activeTab === TAB_VALUES.SHOW && (
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
                  {activeTab === TAB_VALUES.BOOK
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
                  {activeTab === TAB_VALUES.BOOK
                    ? "This was a re-read"
                    : "This was a rewatch"}
                </FormLabel>
              </FormItem>
            )}
          />
        </div>

        <div className="mt-8 border-t border-line pt-6">
          <SubmitButton
            isSubmitting={form.formState.isSubmitting}
            className="w-full"
          >
            {activeTab === TAB_VALUES.BOOK
              ? "Save book"
              : activeTab === TAB_VALUES.MOVIE
                ? "Save movie"
                : "Save show"}
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
}

export default function CreateItemForm() {
  const [activeTab, setActiveTab] = useState<TabValue>(TAB_VALUES.BOOK);

  return (
    <>
      <PageHeader intro="Log a book, a movie or a season of TV.">
        Add new item
      </PageHeader>

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

        <TabsContent value={activeTab} className="mt-6">
          <FormComponent key={activeTab} activeTab={activeTab} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function getSchemaAndDefaults(tab: TabValue) {
  const year = getCurrentYear();

  switch (tab) {
    case TAB_VALUES.BOOK:
      return {
        schema: bookItemSchema,
        defaults: {
          itemtype: ITEM_TYPES.BOOK,
          title: "",
          belongsToYear: year,
          publishedYear: 0,
          redo: false,
          author: "",
        } satisfies BookItemInput,
      };
    case TAB_VALUES.MOVIE:
      return {
        schema: movieItemSchema,
        defaults: {
          itemtype: ITEM_TYPES.MOVIE,
          title: "",
          belongsToYear: year,
          publishedYear: 0,
          redo: false,
          director: "",
        } satisfies MovieItemInput,
      };
    case TAB_VALUES.SHOW:
    default:
      return {
        schema: showItemSchema,
        defaults: {
          itemtype: ITEM_TYPES.SHOW,
          title: "",
          belongsToYear: year,
          publishedYear: 0,
          redo: false,
          season: 0,
          inProgress: false,
        } satisfies ShowItemInput,
      };
  }
}
