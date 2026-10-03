"use server";

import { createClientForServer } from "@/utils/supabase/server";
import { signInSchema, extractFormData } from "@/utils/schemas/validation";

type SignInResult =
  | { ok: true; access_token: string | null; refresh_token: string | null }
  | { ok: false; error: string };

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

export async function signOutAction(): Promise<void> {
  const supabase = await createClientForServer();

  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Server sign out failed:", error);
  }
}
