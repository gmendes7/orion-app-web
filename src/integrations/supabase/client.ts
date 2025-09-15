import { createClient } from "@supabase/supabase-js";

// Lovable: Use Supabase project constants (env-less)
const supabaseUrl = "https://wcwwqfiolxcluyuhmxxf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indjd3dxZmlvbHhjbHV5dWhteHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwOTA4MDMsImV4cCI6MjA3MDY2NjgwM30.IZQUelbBZI492dffw3xd2eYtSn7lx7RcyuKYWtyaDDc";


// 3. Crie e exporte o cliente Supabase para uma aplicação client-side (SPA)
// Esta é a forma correta para um projeto Vite + React.

// 3. Create and export the Supabase client for a client-side app

export const supabase = createClient(supabaseUrl, supabaseAnonKey);