import "server-only";
import { createClient } from "@supabase/supabase-js";

// Skips row level security, so only for jobs that run without me signed in
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;
