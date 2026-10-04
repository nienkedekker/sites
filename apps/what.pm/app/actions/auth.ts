"use server";

import { createClientForServer } from "@/utils/supabase/server";
import {
  changePasswordSchema,
  signInSchema,
  extractFormData,
} from "@/utils/schemas/validation";

export async function signInAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const validation = extractFormData(formData, signInSchema);
  if (!validation.success) {
    return { ok: false, error: validation.errors.join(", ") };
  }

  const supabase = await createClientForServer();
  const { error } = await supabase.auth.signInWithPassword(validation.data);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function changePasswordAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const validation = extractFormData(formData, changePasswordSchema);
  if (!validation.success) {
    return { ok: false, error: validation.errors.join(", ") };
  }

  const supabase = await createClientForServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You're not signed in" };
  }

  const { error } = await supabase.auth.updateUser({
    password: validation.data.password,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const { error: signOutError } = await supabase.auth.signOut({
    scope: "others",
  });

  if (signOutError) {
    return {
      ok: false,
      error: "Password changed, but other devices couldn't be signed out",
    };
  }

  return { ok: true };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClientForServer();

  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Server sign out failed:", error);
  }
}
