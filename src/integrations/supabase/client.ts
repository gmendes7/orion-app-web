import { createClient } from "@supabase/supabase-js";

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

<<<<<<< HEAD
// 3. Crie e exporte o cliente Supabase para uma aplicação client-side (SPA)
// Esta é a forma correta para um projeto Vite + React.
=======
// 3. Create and export the Supabase client for a client-side app
>>>>>>> f608cb6b50ee09f13f1ecae903c479861aa0ed64
export const supabase = createClient(supabaseUrl, supabaseAnonKey);