"use client";

import { useState } from "react";
import { signInAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";
import { FormMessage, type Message } from "@/components/forms/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInSchema, type SignInInput } from "@/utils/schemas/validation";
import { useFormValidation } from "@/hooks/use-form-validation";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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

export default function SignInPage() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<SignInInput>({
    email: "",
    password: "",
  });

  const { errors, validateField, validateForm } =
    useFormValidation(signInSchema);

  const handleFormSubmit = (formData: FormData) => {
    // Get form data for validation
    const validationData = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    // Validate before submitting
    const isFormValid = validateForm(validationData);
    if (!isFormValid) {
      return; // Don't submit if validation fails
    }

    // If validation passes, proceed with server action
    return signInAction(formData);
  };

  // Get message from search params
  const message: Message | undefined = searchParams.get("error")
    ? { error: searchParams.get("error")! }
    : searchParams.get("success")
      ? { success: searchParams.get("success")! }
      : searchParams.get("message")
        ? { message: searchParams.get("message")! }
        : undefined;

  const handleInputChange = (field: keyof SignInInput, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    validateField(field, value);
  };

  return (
    <form
      action={handleFormSubmit}
      className="flex-1 flex flex-col max-w-96 mx-auto"
    >
      <h1 className="text-2xl font-medium">Sign in</h1>
      <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
        {message && <FormMessage message={message} />}
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          className={errors.email ? "border-red-500" : ""}
        />
        <FieldError errors={errors.email} />

        <div className="flex justify-between items-center">
          <Label htmlFor="password">Password</Label>
          <Link
            className="text-xs text-foreground underline"
            href="/forgot-password"
          >
            Forgot Password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          name="password"
          placeholder="Your password"
          value={formData.password}
          onChange={(e) => handleInputChange("password", e.target.value)}
          className={errors.password ? "border-red-500" : ""}
        />
        <FieldError errors={errors.password} />

        <SubmitButton pendingText="Signing In...">Sign in</SubmitButton>
      </div>
    </form>
  );
}
