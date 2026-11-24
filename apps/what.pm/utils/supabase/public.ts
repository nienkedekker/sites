import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Missing required Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
  );
}

export const supabasePublic = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
      flowType: "implicit",
    },
    global: {
      headers: {},
    },
  },
);
