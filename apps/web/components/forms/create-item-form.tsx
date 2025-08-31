"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createItemAction } from "@/app/actions/items";
import { SubmitButton } from "./submit-button";
import { FormMessage, type Message } from "./form-message";
import {
  itemCreationSchema,
  type ItemCreationInput,
} from "@/utils/schemas/validation";
import { useFormValidation } from "@/hooks/use-form-validation";
import { ITEM_TYPES } from "@/utils/constants/app";

// Error display component
function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <div className="text-sm text-red-600 mt-1" role="alert">
      {errors.map((error, index) => (
        <div key={index}>{error}</div>
      ))}
    </div>
  );
}

export default function CreateItemForm({ message }: { message?: Message }) {
  const [activeTab, setActiveTab] = useState<"book" | "movie" | "show">("book");
  const [formData, setFormData] = useState<Partial<ItemCreationInput>>({
    itemtype: ITEM_TYPES.BOOK,
    redo: false,
  });

  const { errors, validateField, validateForm } =
    useFormValidation(itemCreationSchema);

  const handleFormSubmit = (formData: FormData) => {
    // Get current form data for validation
    const currentData = Object.fromEntries(formData.entries());

    // Convert form data to proper types for validation
    const validationData = {
      itemtype: currentData.itemtype as string,
      title: (currentData.title as string) || "",
      publishedYear: parseInt(currentData.publishedYear as string) || 0,
      redo: currentData.redo === "on",
      // Always include these fields as strings (empty if not provided)
      author: (currentData.author as string) || "",
      director: (currentData.director as string) || "",
      season: currentData.season
        ? parseInt(currentData.season as string) || 0
        : 0,
    } as ItemCreationInput;

    // Validate before submitting
    const isFormValid = validateForm(validationData);
    if (!isFormValid) {
      return; // Don't submit if validation fails
    }

    // If validation passes, proceed with server action
    return createItemAction(formData);
  };

  const handleInputChange = (
    field: keyof ItemCreationInput,
    value: string | number | boolean,
  ) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    validateField(field, value);
  };

  const handleTabChange = (value: string) => {
    const tab = value as "book" | "movie" | "show";
    setActiveTab(tab);

    let itemtype: (typeof ITEM_TYPES)[keyof typeof ITEM_TYPES];
    if (tab === "book") itemtype = ITEM_TYPES.BOOK;
    else if (tab === "movie") itemtype = ITEM_TYPES.MOVIE;
    else itemtype = ITEM_TYPES.SHOW;

    const baseData = {
      itemtype,
      title: formData.title || "",
      publishedYear: formData.publishedYear || 0,
      redo: formData.redo || false,
    };

    // Add type-specific fields based on tab
    let newFormData: Partial<ItemCreationInput>;
    if (tab === "book") {
      newFormData = { ...baseData, author: formData.author || "" };
    } else if (tab === "movie") {
      newFormData = { ...baseData, director: formData.director || "" };
    } else {
      newFormData = { ...baseData, season: formData.season || 1 };
    }

    setFormData(newFormData);
  };

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add New Item</h1>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="book">Book</TabsTrigger>
          <TabsTrigger value="movie">Movie</TabsTrigger>
          <TabsTrigger value="show">TV Show</TabsTrigger>
        </TabsList>

        {/* Book Form */}
        <TabsContent value="book">
          <form
            action={handleFormSubmit}
            className="space-y-4"
            aria-labelledby="book-form-title"
          >
            <h2 id="book-form-title" className="sr-only">
              Add new book
            </h2>
            {message && <FormMessage message={message} />}
            <input type="hidden" name="itemtype" value={ITEM_TYPES.BOOK} />

            <div>
              <Label htmlFor="book-title">Title</Label>
              <Input
                type="text"
                id="book-title"
                name="title"
                value={formData.title || ""}
                onChange={(e) => handleInputChange("title", e.target.value)}
                aria-describedby="book-title-error"
                className={errors.title ? "border-red-500" : ""}
              />
              <FieldError errors={errors.title} />
            </div>

            <div>
              <Label htmlFor="book-author">Author</Label>
              <Input
                type="text"
                id="book-author"
                name="author"
                value={formData.author || ""}
                onChange={(e) => handleInputChange("author", e.target.value)}
                aria-describedby="book-author-error"
                className={errors.author ? "border-red-500" : ""}
              />
              <FieldError errors={errors.author} />
            </div>

            <div>
              <Label htmlFor="book-publishedYear">Published Year</Label>
              <Input
                type="number"
                id="book-publishedYear"
                name="publishedYear"
                value={formData.publishedYear || ""}
                onChange={(e) =>
                  handleInputChange(
                    "publishedYear",
                    parseInt(e.target.value) || 0,
                  )
                }
                aria-describedby="book-year-error"
                className={errors.publishedYear ? "border-red-500" : ""}
              />
              <FieldError errors={errors.publishedYear} />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="book-redo"
                name="redo"
                checked={formData.redo || false}
                onCheckedChange={(checked) =>
                  handleInputChange("redo", checked === true)
                }
              />
              <Label htmlFor="book-redo">This was a re-read</Label>
            </div>

            <SubmitButton>Save book</SubmitButton>
          </form>
        </TabsContent>

        {/* Movie Form */}
        <TabsContent value="movie">
          <form
            action={handleFormSubmit}
            className="space-y-4"
            aria-labelledby="movie-form-title"
          >
            <h2 id="movie-form-title" className="sr-only">
              Add new movie
            </h2>
            {message && <FormMessage message={message} />}
            <input type="hidden" name="itemtype" value={ITEM_TYPES.MOVIE} />

            <div>
              <Label htmlFor="movie-title">Title</Label>
              <Input
                type="text"
                id="movie-title"
                name="title"
                value={formData.title || ""}
                onChange={(e) => handleInputChange("title", e.target.value)}
                aria-describedby="movie-title-error"
                className={errors.title ? "border-red-500" : ""}
              />
              <FieldError errors={errors.title} />
            </div>

            <div>
              <Label htmlFor="movie-director">Director</Label>
              <Input
                type="text"
                id="movie-director"
                name="director"
                value={formData.director || ""}
                onChange={(e) => handleInputChange("director", e.target.value)}
                aria-describedby="movie-director-error"
                className={errors.director ? "border-red-500" : ""}
              />
              <FieldError errors={errors.director} />
            </div>

            <div>
              <Label htmlFor="movie-publishedYear">Release Year</Label>
              <Input
                type="number"
                id="movie-publishedYear"
                name="publishedYear"
                value={formData.publishedYear || ""}
                onChange={(e) =>
                  handleInputChange(
                    "publishedYear",
                    parseInt(e.target.value) || 0,
                  )
                }
                aria-describedby="movie-year-error"
                className={errors.publishedYear ? "border-red-500" : ""}
              />
              <FieldError errors={errors.publishedYear} />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="movie-redo"
                name="redo"
                checked={formData.redo || false}
                onCheckedChange={(checked) =>
                  handleInputChange("redo", checked === true)
                }
              />
              <Label htmlFor="movie-redo">This was a rewatch</Label>
            </div>

            <SubmitButton>Save movie</SubmitButton>
          </form>
        </TabsContent>

        {/* TV Show Form */}
        <TabsContent value="show">
          <form
            action={handleFormSubmit}
            className="space-y-4"
            aria-labelledby="show-form-title"
          >
            <h2 id="show-form-title" className="sr-only">
              Add new TV show
            </h2>
            {message && <FormMessage message={message} />}
            <input type="hidden" name="itemtype" value={ITEM_TYPES.SHOW} />

            <div>
              <Label htmlFor="show-title">Title</Label>
              <Input
                type="text"
                id="show-title"
                name="title"
                value={formData.title || ""}
                onChange={(e) => handleInputChange("title", e.target.value)}
                aria-describedby="show-title-error"
                className={errors.title ? "border-red-500" : ""}
              />
              <FieldError errors={errors.title} />
            </div>

            <div>
              <Label htmlFor="show-season">Season</Label>
              <Input
                type="number"
                id="show-season"
                name="season"
                value={formData.season || ""}
                onChange={(e) =>
                  handleInputChange("season", parseInt(e.target.value) || 0)
                }
                aria-describedby="show-season-error"
                className={errors.season ? "border-red-500" : ""}
              />
              <FieldError errors={errors.season} />
            </div>

            <div>
              <Label htmlFor="show-publishedYear">Release Year</Label>
              <Input
                type="number"
                id="show-publishedYear"
                name="publishedYear"
                value={formData.publishedYear || ""}
                onChange={(e) =>
                  handleInputChange(
                    "publishedYear",
                    parseInt(e.target.value) || 0,
                  )
                }
                aria-describedby="show-year-error"
                className={errors.publishedYear ? "border-red-500" : ""}
              />
              <FieldError errors={errors.publishedYear} />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-redo"
                name="redo"
                checked={formData.redo || false}
                onCheckedChange={(checked) =>
                  handleInputChange("redo", checked === true)
                }
              />
              <Label htmlFor="show-redo">This was a rewatch</Label>
            </div>

            <SubmitButton>Save show</SubmitButton>
          </form>
        </TabsContent>
      </Tabs>
    </main>
  );
}
