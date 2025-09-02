import { createClient } from "@supabase/supabase-js";

// 1. Get the environment variables specific to Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Check if the variables are defined, and throw an error if not
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL and Anon Key must be defined in your .env.local file"
  );
}

// 3. Create and export the Supabase client for a client-side app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
