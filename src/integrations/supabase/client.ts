import { createClient } from "@supabase/supabase-js";

// Use environment variables injected at build time (Vite uses import.meta.env)
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || "";
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "";

if (!supabaseUrl || !supabaseAnonKey) {
  // In development the .env may not be set — log a friendly warning
  // Do NOT hardcode secrets in source.
  // The app will still attempt to create the client (empty values will fail at runtime).
  // If you see this message in production, add the necessary VITE_SUPABASE_* variables.
  console.warn(
    "Supabase client: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
