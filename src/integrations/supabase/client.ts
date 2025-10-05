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
