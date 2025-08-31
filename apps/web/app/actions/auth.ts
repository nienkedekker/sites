"use server";

import { createClientForServer } from "@/utils/supabase/server";
import { signInSchema, extractFormData } from "@/utils/schemas/validation";
import { redirect } from "next/navigation";

export async function signInActionReturnSession(formData: FormData) {
  const validation = extractFormData(formData, signInSchema);
  if (!validation.success) {
    return { ok: false, error: validation.errors.join(", ") };
  }

  const supabase = await createClientForServer();
  const { data, error } = await supabase.auth.signInWithPassword(
    validation.data,
  );

  if (error) return { ok: false, error: error.message };

  return {
    ok: true,
    access_token: data.session?.access_token ?? null,
    refresh_token: data.session?.refresh_token ?? null,
  };
}

export const signOutAction = async () => {
  const supabase = await createClientForServer();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};
