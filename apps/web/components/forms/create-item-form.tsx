"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { createItemAction } from "@/app/actions/items";
import { SubmitButton } from "./submit-button";
import { FormMessage, type Message } from "./form-message";
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
import { TAB_VALUES, type TabValue } from "@/utils/constants/app";

export default function CreateItemForm({ message }: { message?: Message }) {
  const [activeTab, setActiveTab] = useState<TabValue>(TAB_VALUES.BOOK);

  // Create forms for each type to avoid TypeScript union conflicts
  const bookForm = useForm<BookItemInput>({
    resolver: zodResolver(bookItemSchema),
    defaultValues: {
      itemtype: "Book",
      title: "",
      publishedYear: new Date().getFullYear(),
      redo: false,
      author: "",
    },
  });

  const movieForm = useForm<MovieItemInput>({
    resolver: zodResolver(movieItemSchema),
    defaultValues: {
      itemtype: "Movie",
      title: "",
      publishedYear: new Date().getFullYear(),
      redo: false,
      director: "",
    },
  });

  const showForm = useForm<ShowItemInput>({
    resolver: zodResolver(showItemSchema),
    defaultValues: {
      itemtype: "Show",
      title: "",
      publishedYear: new Date().getFullYear(),
      redo: false,
      season: 1,
    },
  });

  const handleTabChange = (value: string) => {
    const tab = value as TabValue;
    setActiveTab(tab);
  };

  const onSubmit = async (
    data: BookItemInput | MovieItemInput | ShowItemInput,
  ) => {
    // Convert react-hook-form data to FormData for server action
    const formData = new FormData();
    formData.append("itemtype", data.itemtype);
    formData.append("title", data.title);
    formData.append("publishedYear", data.publishedYear.toString());
    formData.append("redo", data.redo ? "on" : "");

    if ("author" in data && data.author) formData.append("author", data.author);
    if ("director" in data && data.director)
      formData.append("director", data.director);
    if ("season" in data && data.season)
      formData.append("season", data.season.toString());

    return createItemAction(formData);
  };

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add New Item</h1>

      {message && <FormMessage message={message} />}

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value={TAB_VALUES.BOOK}>Book</TabsTrigger>
          <TabsTrigger value={TAB_VALUES.MOVIE}>Movie</TabsTrigger>
          <TabsTrigger value={TAB_VALUES.SHOW}>TV Show</TabsTrigger>
        </TabsList>

        {/* Book Form */}
        <TabsContent value={TAB_VALUES.BOOK} className="mt-6 space-y-4">
          <Form {...bookForm}>
            <form
              onSubmit={bookForm.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={bookForm.control}
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

              <FormField
                control={bookForm.control}
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
                control={bookForm.control}
                name="publishedYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Published Year</FormLabel>
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
                control={bookForm.control}
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
                      <FormLabel>This was a re-read</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <SubmitButton>Save book</SubmitButton>
            </form>
          </Form>
        </TabsContent>

        {/* Movie Form */}
        <TabsContent value={TAB_VALUES.MOVIE} className="mt-6 space-y-4">
          <Form {...movieForm}>
            <form
              onSubmit={movieForm.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={movieForm.control}
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

              <FormField
                control={movieForm.control}
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

              <FormField
                control={movieForm.control}
                name="publishedYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Release Year</FormLabel>
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
                control={movieForm.control}
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
                      <FormLabel>This was a rewatch</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <SubmitButton>Save movie</SubmitButton>
            </form>
          </Form>
        </TabsContent>

        {/* Show Form */}
        <TabsContent value={TAB_VALUES.SHOW} className="mt-6 space-y-4">
          <Form {...showForm}>
            <form
              onSubmit={showForm.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={showForm.control}
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

              <FormField
                control={showForm.control}
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

              <FormField
                control={showForm.control}
                name="publishedYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Release Year</FormLabel>
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
                control={showForm.control}
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
                      <FormLabel>This was a rewatch</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <SubmitButton>Save show</SubmitButton>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </main>
  );
}
