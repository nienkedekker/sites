import { createClient } from "@supabase/supabase-js";

export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
      flowType: "implicit",
    },
    global: {
      headers: {
        // no Authorization cookie header; anonymous RLS applies
      },
    },
  },
);
