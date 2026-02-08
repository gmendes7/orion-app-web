// Supabase client wrapper - reads runtime config from Vite env variables.
// Do NOT commit your real keys. Add them to a local .env file (see .env.example).
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Vite exposes env vars prefixed with VITE_ via import.meta.env
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || "";
const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // In dev we want a clear error if envs are missing but avoid throwing during
  // static analysis in some tools - use console.warn.
  // Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local
  console.warn(
    "[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not defined. Configure .env.local based on .env.example"
  );
}

// Use localStorage only in browser environments
const authOptions =
  typeof window !== "undefined" && typeof localStorage !== "undefined"
    ? {
        auth: {
          storage: localStorage as Storage,
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    : {};

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  authOptions
);

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
