"use server";

import { createClientForServer } from "@/utils/supabase/server";
import { signInSchema, extractFormData } from "@/utils/schemas/validation";
import { redirect } from "next/navigation";

/** Result type for sign-in action */
type SignInResult =
  | { ok: true; access_token: string | null; refresh_token: string | null }
  | { ok: false; error: string };

/**
 * Server action to sign in a user with email and password.
 * Returns tokens on success for client-side session hydration.
 */
export async function signInActionReturnSession(
  formData: FormData,
): Promise<SignInResult> {
  const validation = extractFormData(formData, signInSchema);
  if (!validation.success) {
    return { ok: false, error: validation.errors.join(", ") };
  }

  const supabase = await createClientForServer();
  const { data, error } = await supabase.auth.signInWithPassword(
    validation.data,
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    access_token: data.session?.access_token ?? null,
    refresh_token: data.session?.refresh_token ?? null,
  };
}

/**
 * Server action to sign out the current user.
 * Clears server-side session cookies and redirects to sign-in page.
 */
export async function signOutAction(): Promise<never> {
  const supabase = await createClientForServer();

  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Server sign out failed:", error);
    // Continue to redirect even if sign out fails
    // Client-side sign out should have already cleared local state
  }

  return redirect("/sign-in");
}
