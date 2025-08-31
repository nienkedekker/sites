"use client";

import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";
import { FormMessage, type Message } from "@/components/forms/form-message";
import { Input } from "@/components/ui/input";
import { signInSchema, type SignInInput } from "@/utils/schemas/validation";
import { useSearchParams } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

function SignInForm() {
  const searchParams = useSearchParams();
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInInput) => {
    // Convert react-hook-form data to FormData for server action
    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);

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

  return (
    <div className="flex-1 flex flex-col max-w-96 mx-auto">
      <h1 className="text-2xl font-medium">Sign in</h1>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-2 [&>input]:mb-3 mt-8"
        >
          {message && <FormMessage message={message} />}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Your password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <SubmitButton pendingText="Signing In...">Sign in</SubmitButton>
        </form>
      </Form>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
