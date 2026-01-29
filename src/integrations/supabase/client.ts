<<<<<<< Updated upstream
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_CONFIG } from "@/lib/supabaseConfig";

/**
 * 🔐 Cliente Supabase Configurado
 * 
 * Cliente singleton do Supabase para toda a aplicação.
 * Usa configurações centralizadas de supabaseConfig.ts
 * 
 * Características:
 * - Autenticação automática via localStorage
 * - Persistência de sessão
 * - Auto-refresh de tokens
 * - Configuração otimizada para SPA (Single Page Application)
 * 
 * @see https://supabase.com/docs/reference/javascript/initializing
 */
export const supabase = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey,
  {
    auth: {
      // Configurações de autenticação otimizadas
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    },
  }
);
=======
// Supabase client wrapper — reads runtime config from Vite env variables.
// Do NOT commit your real keys. Add them to a local `.env` file (see `.env.example`).
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Vite exposes env vars prefixed with VITE_ via import.meta.env
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || "";
const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // In dev we want a clear error if envs are missing
  // but avoid throwing during static analysis in some tools — use console.warn
  // The app will still error if you try to use the client without keys.
  // Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local
  // Example in project root: .env.local
  // VITE_SUPABASE_URL="https://<your-project>.supabase.co"
  // VITE_SUPABASE_ANON_KEY="public-anon-key"
  // Restart the dev server after adding envs.
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
>>>>>>> Stashed changes
