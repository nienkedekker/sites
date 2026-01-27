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

/** Allowed redirect paths (whitelist for security) */
const ALLOWED_REDIRECT_PREFIXES = [
  "/",
  "/year/",
  "/item/",
  "/stats",
  "/search",
  "/about",
  "/export",
  "/create",
];

/**
 * Validates and sanitizes a redirect URL.
 * Returns "/" if the URL is invalid or potentially malicious.
 */
function getSafeRedirectUrl(rawRedirect: string | null): string {
  if (!rawRedirect) return "/";

  // Must start with single "/" and not be a protocol-relative URL
  if (!rawRedirect.startsWith("/") || rawRedirect.startsWith("//")) {
    return "/";
  }

  // Check against whitelist of allowed prefixes
  const isAllowed = ALLOWED_REDIRECT_PREFIXES.some(
    (prefix) => rawRedirect === prefix || rawRedirect.startsWith(prefix),
  );

  return isAllowed ? rawRedirect : "/";
}

/**
 * Extracts and validates message from query parameters.
 * Returns null if no valid message found.
 */
function getQueryMessage(
  searchParams: URLSearchParams,
): { type: "error" | "success" | "info"; text: string } | null {
  const error = searchParams.get("error");
  const success = searchParams.get("success");
  const message = searchParams.get("message");

  // Sanitize: only allow alphanumeric, spaces, and basic punctuation
  const sanitize = (text: string): string => {
    return text.replace(/[^\w\s.,!?-]/g, "").slice(0, 200);
  };

  if (error) return { type: "error", text: sanitize(error) };
  if (success) return { type: "success", text: sanitize(success) };
  if (message) return { type: "info", text: sanitize(message) };

  return null;
}

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

    const redirectTo = getSafeRedirectUrl(searchParams.get("redirect"));

    router.refresh();
    router.push(redirectTo);
  };

  const queryMessage = getQueryMessage(searchParams);

  const {
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
  } = form;

  return (
    <div className="max-w-md mx-auto space-y-6">
      <PageHeader>Sign in</PageHeader>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {queryMessage && (
            <FormMessage
              className={
                queryMessage.type === "success"
                  ? "text-green-600 dark:text-green-400"
                  : queryMessage.type === "error"
                    ? "text-red-600 dark:text-red-400"
                    : undefined
              }
            >
              {queryMessage.text}
            </FormMessage>
          )}
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
