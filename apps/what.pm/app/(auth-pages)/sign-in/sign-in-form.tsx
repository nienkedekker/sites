"use client";

import { CSSProperties } from "react";
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
import { formStyles } from "@/utils/styles";

import { signInSchema, type SignInInput } from "@/utils/schemas/validation";
import { signInActionReturnSession } from "@/app/actions/auth";
import { supabaseBrowser } from "@/utils/supabase/browser";
import { getSafeRedirectUrl } from "@/utils/auth/safe-redirect";

function getQueryMessage(
  searchParams: URLSearchParams,
): { type: "error" | "success" | "info"; text: string } | null {
  const error = searchParams.get("error");
  const success = searchParams.get("success");
  const message = searchParams.get("message");

  const sanitize = (text: string): string => {
    return text.replace(/[^\w\s.,!?-]/g, "").slice(0, 200);
  };

  if (error) return { type: "error", text: sanitize(error) };
  if (success) return { type: "success", text: sanitize(success) };
  if (message) return { type: "info", text: sanitize(message) };

  return null;
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: SignInInput) => {
    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);

    const res = await signInActionReturnSession(formData);

    if (!res.ok) {
      form.setError("root", { message: res.error ?? "Sign-in failed" });
      return;
    }

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
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`${formStyles.container} rise w-full max-w-md space-y-6 shadow-[6px_6px_0_var(--rule)] lg:max-w-none`}
        style={{ "--delay": "200ms" } as CSSProperties}
      >
        {queryMessage && (
          <FormMessage
            className={
              queryMessage.type === "success"
                ? "text-ink"
                : queryMessage.type === "error"
                  ? "text-danger"
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
                <Input type="email" placeholder="you@example.com" {...field} />
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
                <Input type="password" placeholder="Your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <SubmitButton
          pendingText="Signing In..."
          disabled={isSubmitting}
          className="w-full"
        >
          Sign in
        </SubmitButton>
      </form>
    </Form>
  );
}
