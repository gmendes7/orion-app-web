import { createClient } from "@supabase/supabase-js";
import { SUPABASE_CONFIG } from "@/lib/supabaseConfig";

<<<<<<< HEAD
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
=======
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
>>>>>>> b31039c6d1458bd03a714a75579f77202a6ce713
