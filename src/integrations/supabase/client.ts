import { createBrowserClient } from "@supabase/ssr";

// 1. Obtenha as variáveis de ambiente específicas do Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Verifique se as variáveis estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL and Anon Key must be defined in your .env.local file"
  );
}

// 3. Crie e exporte o cliente Supabase
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
