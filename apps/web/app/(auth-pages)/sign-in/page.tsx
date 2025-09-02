"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";

import { signInSchema, type SignInInput } from "@/utils/schemas/validation";
import { signInActionReturnSession } from "@/app/actions/auth";
import { supabaseBrowser } from "@/utils/supabase/browser";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: SignInInput) => {
    // Convert react-hook-form data to FormData
    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);

    // Call server action, this sets HttpOnly cookies and returns tokens
    const res = await signInActionReturnSession(formData);

    if (!res.ok) {
      form.setError("root", { message: res.error ?? "Sign-in failed" });
      return;
    }

    // Hydrate browser client so <AuthProvider> updates immediately
    if (res.access_token && res.refresh_token) {
      await supabaseBrowser.auth.setSession({
        access_token: res.access_token,
        refresh_token: res.refresh_token,
      });
    }

    const rawRedirect = searchParams.get("redirect") || "/";
    const redirectTo =
      rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
        ? rawRedirect
        : "/";

    router.refresh();
    router.push(redirectTo);
  };

  // Optional messages from query params
  const message = searchParams.get("error")
    ? { error: searchParams.get("error")! }
    : searchParams.get("success")
      ? { success: searchParams.get("success")! }
      : searchParams.get("message")
        ? { message: searchParams.get("message")! }
        : undefined;

  const {
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
  } = form;

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <PageHeader>Sign in</PageHeader>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {message && <FormMessage>{JSON.stringify(message)}</FormMessage>}
          {errors.root?.message && (
            <FormMessage>{errors.root.message}</FormMessage>
          )}

          <FormField
            control={control}
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
            control={control}
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

          <SubmitButton pendingText="Signing In..." disabled={isSubmitting}>
            Sign in
          </SubmitButton>
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
