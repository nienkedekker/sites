"use client";

import { useState } from "react";
import { updateItemAction } from "@/app/actions/items";
import { SubmitButton } from "./submit-button";
import { FormMessage, type Message } from "./form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Item } from "@/types";
import {
  itemCreationSchema,
  type ItemCreationInput,
} from "@/utils/schemas/validation";
import { useFormValidation } from "@/hooks/use-form-validation";

interface UpdateItemFormProps {
  item: Item;
  message?: Message;
}

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

export default function UpdateItemForm({ item, message }: UpdateItemFormProps) {
  const [formData, setFormData] = useState<Partial<ItemCreationInput>>({
    itemtype: item.itemtype as ItemCreationInput["itemtype"],
    title: item.title,
    publishedYear: item.published_year,
    redo: item.redo || false,
    author: item.author || "",
    director: item.director || "",
    season: item.season || undefined,
  });

  const { errors, validateField, validateForm } =
    useFormValidation(itemCreationSchema);

  const handleFormSubmit = (formData: FormData) => {
    // Get form data for validation
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
    return updateItemAction(formData);
  };

  const handleInputChange = (
    field: keyof ItemCreationInput,
    value: string | number | boolean,
  ) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    validateField(field, value);
  };
  return (
    <form action={handleFormSubmit} className="space-y-4">
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="itemtype" value={item.itemtype} />

      {message && <FormMessage message={message} />}

      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          type="text"
          name="title"
          value={formData.title || ""}
          onChange={(e) => handleInputChange("title", e.target.value)}
          className={errors.title ? "border-red-500" : ""}
        />
        <FieldError errors={errors.title} />
      </div>

      {item.itemtype === "Book" && (
        <div>
          <Label htmlFor="author">Author</Label>
          <Input
            id="author"
            type="text"
            name="author"
            value={formData.author || ""}
            onChange={(e) => handleInputChange("author", e.target.value)}
            className={errors.author ? "border-red-500" : ""}
          />
          <FieldError errors={errors.author} />
        </div>
      )}

      {item.itemtype === "Movie" && (
        <div>
          <Label htmlFor="director">Director</Label>
          <Input
            id="director"
            type="text"
            name="director"
            value={formData.director || ""}
            onChange={(e) => handleInputChange("director", e.target.value)}
            className={errors.director ? "border-red-500" : ""}
          />
          <FieldError errors={errors.director} />
        </div>
      )}

      {item.itemtype === "Show" && (
        <div>
          <Label htmlFor="season">Season</Label>
          <Input
            id="season"
            type="number"
            name="season"
            value={formData.season || ""}
            onChange={(e) =>
              handleInputChange("season", parseInt(e.target.value) || 0)
            }
            className={errors.season ? "border-red-500" : ""}
          />
          <FieldError errors={errors.season} />
        </div>
      )}

      <div>
        <Label htmlFor="publishedYear">Published Year</Label>
        <Input
          id="publishedYear"
          type="number"
          name="publishedYear"
          value={formData.publishedYear || ""}
          onChange={(e) =>
            handleInputChange("publishedYear", parseInt(e.target.value) || 0)
          }
          className={errors.publishedYear ? "border-red-500" : ""}
        />
        <FieldError errors={errors.publishedYear} />
      </div>

      <div>
        <Label htmlFor="belongsToYear">Belongs To Year</Label>
        <Input
          id="belongsToYear"
          type="number"
          name="belongsToYear"
          defaultValue={item.belongs_to_year}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="redo"
          name="redo"
          checked={formData.redo || false}
          onCheckedChange={(checked) =>
            handleInputChange("redo", checked === true)
          }
        />
        <Label htmlFor="redo">Redo?</Label>
      </div>

      <SubmitButton>Update Item</SubmitButton>
    </form>
  );
}
