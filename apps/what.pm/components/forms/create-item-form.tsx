"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { unstable_rethrow } from "next/navigation";
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

import { createItemAction } from "@/app/actions/items";
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
import { toNumber, formatNumberInputValue } from "@/utils/form";

type AnyCreateInput = BookItemInput | MovieItemInput | ShowItemInput;

async function fetchSeasonYears(showId: string): Promise<SeasonYears> {
  try {
    const res = await fetch(
      `/api/seasons?${new URLSearchParams({ id: showId })}`,
    );
    return res.ok ? await res.json() : {};
  } catch {
    return {};
  }
}

function FormComponent({
  activeTab,
  currentYear,
}: {
  activeTab: TabValue;
  currentYear: number;
}) {
  const { schema, defaults } = useMemo(
    () => getSchemaAndDefaults(activeTab, currentYear),
    [activeTab, currentYear],
  );

  const form = useForm<AnyCreateInput>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
    mode: "onBlur",
  });
  // A transition rather than RHF's isSubmitting, which ends when the action
  // redirects but before the next page shows, so the button would re-enable
  const [isSaving, startSaving] = useTransition();

  const [seasonYears, setSeasonYears] = useState<{
    title: string;
    years: SeasonYears;
  } | null>(null);
  const [picked, setPicked] = useState<{ title: string; id: string } | null>(
    null,
  );
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
    setPicked({ title: result.title, id: result.id });
    if (result.year) form.setValue("publishedYear", result.year, options);
    if (result.creator && activeTab === TAB_VALUES.BOOK) {
      form.setValue("author", result.creator, options);
    }
    if (result.creator && activeTab === TAB_VALUES.MOVIE) {
      form.setValue("director", result.creator, options);
    }
    if (activeTab === TAB_VALUES.SHOW) {
      const years = await fetchSeasonYears(result.id);
      setSeasonYears({ title: result.title, years });
    }
  };

  const formErrors = Object.values(form.formState.errors);
  const hasErrors = formErrors.length > 0;

  const onSubmit = (data: AnyCreateInput) => {
    const fd = new FormData();
    fd.append("itemtype", data.itemtype);
    fd.append("title", data.title);
    fd.append("publishedYear", String(data.publishedYear));
    fd.append("belongsToYear", String(data.belongsToYear));
    fd.append("redo", data.redo ? "on" : "");
    // Only keep the match if the title wasn't changed after picking it
    if (picked && picked.title === data.title) {
      fd.append("externalId", picked.id);
    }

    if ("author" in data && data.author) fd.append("author", data.author);
    if ("director" in data && data.director)
      fd.append("director", data.director);
    if ("season" in data && data.season)
      fd.append("season", String(data.season));
    if ("inProgress" in data && data.inProgress) fd.append("inProgress", "on");
    if ("didNotFinish" in data && data.didNotFinish)
      fd.append("didNotFinish", "on");

    startSaving(async () => {
      try {
        const { error } = await createItemAction(fd);
        form.setError("root", { message: error });
      } catch (error) {
        unstable_rethrow(error);
        form.setError("root", {
          message:
            "Couldn’t reach the server. Check your connection and try again.",
        });
      }
    });
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
            <>
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
                      Currently reading (in progress)
                    </FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="didNotFinish"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Didn’t finish</FormLabel>
                  </FormItem>
                )}
              />
            </>
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
              <FormField
                control={form.control}
                name="didNotFinish"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Didn’t finish</FormLabel>
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
          {form.formState.errors.root && (
            <p role="alert" className="mb-4 text-sm text-danger">
              {form.formState.errors.root.message}
            </p>
          )}
          <SubmitButton
            isSubmitting={isSaving || form.formState.isSubmitting}
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

export default function CreateItemForm({
  aside,
  currentYear,
}: {
  aside?: React.ReactNode;
  currentYear: number;
}) {
  const [activeTab, setActiveTab] = useState<TabValue>(TAB_VALUES.BOOK);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as TabValue)}
      className="grid w-full gap-y-8 lg:grid-cols-[minmax(0,42rem)_1fr] lg:gap-x-16"
    >
      <TabsList className="grid w-full grid-cols-3 lg:col-start-1">
        <TabsTrigger value={TAB_VALUES.BOOK}>Book</TabsTrigger>
        <TabsTrigger value={TAB_VALUES.MOVIE}>Movie</TabsTrigger>
        <TabsTrigger value={TAB_VALUES.SHOW}>TV Show</TabsTrigger>
      </TabsList>

      <TabsContent value={activeTab} className="lg:col-start-1">
        <FormComponent
          key={activeTab}
          activeTab={activeTab}
          currentYear={currentYear}
        />
      </TabsContent>

      {aside}
    </Tabs>
  );
}

function getSchemaAndDefaults(tab: TabValue, year: number) {
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
          inProgress: false,
          didNotFinish: false,
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
          didNotFinish: false,
        } satisfies ShowItemInput,
      };
  }
}
