// Supabase client — uses hardcoded project values (publishable/anon key is safe for client)
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = "https://wcwwqfiolxcluyuhmxxf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indjd3dxZmlvbHhjbHV5dWhteHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwOTA4MDMsImV4cCI6MjA3MDY2NjgwM30.IZQUelbBZI492dffw3xd2eYtSn7lx7RcyuKYWtyaDDc";

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
