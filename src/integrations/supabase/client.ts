<<<<<<< HEAD
import { createClient } from "@supabase/supabase-js";

<<<<<<< HEAD
// 1. Obtenha as variáveis de ambiente específicas do Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Verifique se as variáveis estão definidas. Isso evita a tela branca
//    e mostra um erro claro no console se o .env.local estiver faltando.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL and Anon Key must be defined in your .env.local file with the VITE_ prefix."
  );
}

// 1. Get the environment variables specific to Vite (with safe fallbacks)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "https://wcwwqfiolxcluyuhmxxf.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indjd3dxZmlvbHhjbHV5dWhteHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwOTA4MDMsImV4cCI6MjA3MDY2NjgwM30.IZQUelbBZI492dffw3xd2eYtSn7lx7RcyuKYWtyaDDc";

// 2. Check if the variables are defined, and throw an error if not
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL and Anon Key must be configured"
  );
}
>>>>>>> 19ef3cb1a0323cd34302819c4ff9da4b6bdfcf66

// 3. Crie e exporte o cliente Supabase para uma aplicação client-side (SPA)
// Esta é a forma correta para um projeto Vite + React.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
=======
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
>>>>>>> bdf2708e3e5cecc823521c900585244b52f92958
