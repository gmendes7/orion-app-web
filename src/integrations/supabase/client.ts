import { createClient } from "@supabase/supabase-js";

// 1. Get the environment variables specific to Vite (with safe fallbacks)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "https://wcwwqfiolxcluyuhmxxf.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indjd3dxZmlvbHhjbHV5dWhteHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwOTA4MDMsImV4cCI6MjA3MDY2NjgwM30.IZQUelbBZI492dffw3xd2eYtSn7lx7RcyuKYWtyaDDc";

// 2. Check if the variables are defined, and throw an error if not
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL and Anon Key must be configured"
  );
}

// 3. Create and export the Supabase client for a client-side app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);